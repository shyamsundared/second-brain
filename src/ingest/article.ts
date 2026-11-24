// Downloads a web page and pulls out the main article text (like Firefox's Reader View).
//
// The server fetches URLs that users give it, so it must not be usable to reach private
// addresses (localhost, the database, cloud metadata at 169.254.169.254...). That check
// happens in `lookup`, i.e. on the IP actually being connected to, for every redirect too.
// Checking the hostname before fetching wouldn't be enough: DNS can answer differently later.
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5_000_000;   // bigger than any real article page
const MAX_TEXT_CHARS = 50_000; // ~60 chunks; keeps indexing time bounded for huge pages
const MAX_REDIRECTS = 5;

const privateRanges = new net.BlockList();
for (const [ip, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) privateRanges.addSubnet(ip, prefix, "ipv4");
for (const [ip, prefix] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10]] as const) {
  privateRanges.addSubnet(ip, prefix, "ipv6");
}

function isPrivate(address: string, family: number) {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i); // IPv4 written as IPv6
  if (mapped) return privateRanges.check(mapped[1]!, "ipv4");
  return privateRanges.check(address, family === 6 ? "ipv6" : "ipv4");
}

// Same signature as dns.lookup, but refuses to connect to private addresses
const publicOnlyLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const blocked = addresses.find((a) => isPrivate(a.address, a.family));
    if (blocked) return callback(new BlockedAddressError(blocked.address), "", 0);
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
};

class BlockedAddressError extends Error {
  constructor(address: string) {
    super(`blocked request to private address ${address}`);
  }
}
class HttpStatusError extends Error {
  constructor(readonly status: number) {
    super(`page returned ${status}`);
  }
}

// GET a page, following redirects ourselves so every hop goes through publicOnlyLookup.
// Resolves to null when the response isn't an HTML page (PDF, image...).
function download(url: URL, redirectsLeft = MAX_REDIRECTS): Promise<{ html: string; url: URL } | null> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return Promise.resolve(null);
  // Node skips `lookup` when the host is already an IP (including tricks like http://2130706433,
  // which URL turns into 127.0.0.1), so IP hosts are checked here.
  const ip = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(ip) && isPrivate(ip, net.isIP(ip))) return Promise.reject(new BlockedAddressError(ip));

  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, {
      lookup: publicOnlyLookup,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; BrainlyBot/1.0)", accept: "text/html" },
    }, (res) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        if (redirectsLeft === 0) return reject(new Error("too many redirects"));
        return resolve(download(new URL(location, url), redirectsLeft - 1));
      }
      if (status >= 400) {
        res.resume();
        return reject(new HttpStatusError(status));
      }
      if (!String(res.headers["content-type"]).includes("text/html")) {
        res.resume();
        return resolve(null);
      }

      const parts: Buffer[] = [];
      let size = 0;
      res.on("data", (part: Buffer) => {
        size += part.length;
        if (size > MAX_BYTES) req.destroy(new Error("page too large"));
        else parts.push(part);
      });
      res.on("end", () => resolve({ html: Buffer.concat(parts).toString("utf8"), url }));
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

// Returns null when there's nothing to index (not a page, page gone, private address, paywall/bot block).
// Throws on temporary problems (timeouts, 5xx) so the worker retries.
export async function getArticleText(link: string): Promise<{ title: string; text: string } | null> {
  let page;
  try {
    page = await download(new URL(link));
  } catch (e) {
    if (e instanceof BlockedAddressError) return null;
    if (e instanceof HttpStatusError && e.status < 500 && e.status !== 429) return null; // 404, 403...
    throw e;
  }
  if (!page) return null;

  // jsdom doesn't run the page's scripts or load other resources by default
  const dom = new JSDOM(page.html, { url: page.url.href });
  const article = new Readability(dom.window.document).parse();
  const text = (article?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
  const title = (article?.title || dom.window.document.title || "").trim();
  dom.window.close();

  if (!text && !title) return null;
  return {
    title: title || link,
    text: [title, article?.siteName, article?.byline, text].filter(Boolean).join("\n"),
  };
}

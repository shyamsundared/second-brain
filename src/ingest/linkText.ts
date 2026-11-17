// Fetches searchable text for a saved link (tweet text, YouTube title/description).
// Returns null when the link isn't supported or the lookup fails.

export interface LinkText {
  title: string;
  text: string;
}

const TIMEOUT_MS = 5_000;

function getYouTubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
  const match = url.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
  if (match) return match[2] ?? null;
  return url.searchParams.get("v");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  nbsp: " ", mdash: "—", ndash: "–", hellip: "…",
};

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

async function getTweetText(link: string): Promise<LinkText | null> {
  const res = await fetch(
    `https://publish.twitter.com/oembed?url=${encodeURIComponent(link)}&omit_script=true`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) return null; // deleted, private, or invalid tweet
  const data = (await res.json()) as { html?: string; author_name?: string };
  if (!data.html) return null;
  return {
    title: `Tweet by ${data.author_name ?? "unknown"}`,
    text: htmlToText(data.html),
  };
}

async function getYouTubeText(url: URL): Promise<LinkText | null> {
  const id = getYouTubeId(url);
  const key = process.env["YOUTUBE_API_KEY"];
  if (!id || !key) return null;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(id)}&key=${key}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items?: {
      snippet?: { title: string; channelTitle: string; description: string; tags?: string[] };
    }[];
  };
  const s = data.items?.[0]?.snippet;
  if (!s) return null;
  return {
    title: s.title,
    text: [s.title, s.channelTitle, s.description, ...(s.tags ?? [])].join("\n"),
  };
}

export async function getLinkText(link: string): Promise<LinkText | null> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  try {
    if (host === "x.com" || host === "twitter.com") return await getTweetText(link);
    if (host === "youtube.com" || host === "youtu.be") return await getYouTubeText(url);
  } catch {
    // network error or timeout: save the content without text
  }
  return null;
}

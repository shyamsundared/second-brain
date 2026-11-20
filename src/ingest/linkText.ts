// Fetches searchable text for a saved link (tweet text, YouTube title/description/transcript).
// Returns null when there's nothing to fetch (unsupported link, deleted tweet, missing video).
// Throws on network/API errors, so the background job can retry later.
import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptLine {
  text: string;
  startSeconds: number;
}

export interface LinkText {
  title: string;
  text: string; // tweet text, or a video's title/channel/description/tags
  transcript: TranscriptLine[]; // empty unless it's a YouTube video with captions
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
  if (res.status === 404 || res.status === 403) return null; // deleted, private, or invalid tweet
  if (!res.ok) throw new Error(`twitter oembed failed: ${res.status}`);
  const data = (await res.json()) as { html?: string; author_name?: string };
  if (!data.html) return null;
  return {
    title: `Tweet by ${data.author_name ?? "unknown"}`,
    text: htmlToText(data.html),
    transcript: [],
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
  if (!res.ok) throw new Error(`youtube api failed: ${res.status}`);
  const data = (await res.json()) as {
    items?: {
      snippet?: { title: string; channelTitle: string; description: string; tags?: string[] };
    }[];
  };
  const s = data.items?.[0]?.snippet;
  if (!s) return null; // video deleted or private
  const transcript = await getTranscript(id);
  return {
    title: s.title,
    text: [s.title, s.channelTitle, s.description, ...(s.tags ?? [])].join("\n"),
    transcript,
  };
}

// What's said in the video, line by line with start times. Uses an unofficial scraper that
// can break when YouTube changes things, and many videos have no captions, so failure means [].
async function getTranscript(videoId: string): Promise<TranscriptLine[]> {
  try {
    const lines = await YoutubeTranscript.fetchTranscript(videoId, {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }),
    });
    // The package returns milliseconds for YouTube's newer caption format and seconds for
    // the older one. No caption line lasts 100+ seconds, so big durations mean milliseconds.
    const inMs = lines.some((l) => l.duration > 100);
    return lines.map((l) => ({
      text: l.text.replace(/\s+/g, " ").trim(),
      startSeconds: Math.floor(inMs ? l.offset / 1000 : l.offset),
    }));
  } catch {
    return [];
  }
}

export async function getLinkText(link: string): Promise<LinkText | null> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "x.com" || host === "twitter.com") return getTweetText(link);
  if (host === "youtube.com" || host === "youtu.be") return getYouTubeText(url);
  return null;
}

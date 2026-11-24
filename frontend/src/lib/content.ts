export interface Content {
  id: number
  title: string
  link: string
  tags: string[]
  // Background indexing: fetching text, chunking, embedding
  status: "pending" | "processing" | "ready" | "failed"
  // Only on search results: where in the video the match is (null if it's not in the transcript)
  momentSeconds?: number | null
  momentText?: string | null
}

export type Kind = "youtube" | "twitter" | "article"

// What to show for a link: a YouTube embed, a tweet embed, or a plain link card
export function kindOf(link: string): Kind {
  try {
    const host = new URL(link).hostname.replace(/^(www\.|m\.)/, "")
    if (host === "youtube.com" || host === "youtu.be") return "youtube"
    if (host === "x.com" || host === "twitter.com") return "twitter"
  } catch {
    // not a valid URL: treat it as a plain link
  }
  return "article"
}

// "https://www.youtube.com/watch?v=abc123" -> "abc123"
// "https://youtu.be/abc123"                -> "abc123"
// "https://www.youtube.com/shorts/abc123"  -> "abc123"
export function getYouTubeId(link: string) {
  const url = new URL(link)
  if (url.hostname === "youtu.be") return url.pathname.slice(1)
  if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2]
  return url.searchParams.get("v")
}

// 754 -> "12:34", 3754 -> "1:02:34"
export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

// fetch() with JSON headers and the saved login token
export function api(path: string, init: RequestInit = {}) {
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      authorization: localStorage.getItem("token") ?? "",
    },
  })
}

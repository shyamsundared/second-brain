export interface Content {
  id: number
  title: string
  link: string
  tags: string[]
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

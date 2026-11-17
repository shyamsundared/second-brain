import { useEffect } from "react";
import { ShareIcon } from "../../icons/shareicon";

declare global {
  interface Window {
    twttr?: { widgets: { load: () => void } };
  }
}

interface CardProps {
  title: string;
  link: string;
  type: "twitter" | "youtube";
}

// "https://www.youtube.com/watch?v=abc123" -> "abc123"
// "https://youtu.be/abc123"                -> "abc123"
function getYouTubeId(link: string) {
  const url = new URL(link);
  if (url.hostname === "youtu.be") return url.pathname.slice(1);
  return url.searchParams.get("v");
}

export function Card({ title, link, type }: CardProps) {
  // Load Twitter's script once, or ask it to re-scan if it's already loaded
  useEffect(() => {
    if (type !== "twitter") return;
    if (window.twttr) {
      window.twttr.widgets.load();
      return;
    }
    if (!document.getElementById("twitter-wjs")) {
      const script = document.createElement("script");
      script.id = "twitter-wjs";
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [type, link]);

  return (
    <div className="bg-white max-w-72 min-h-40 shadow-md border border-gray-200 rounded-md p-4">
      <div className="flex justify-between">
        <div className="flex items-center text-sm">
          <div className="pr-2 text-gray-500"><ShareIcon /></div>
          {title}
        </div>
        <a href={link} target="_blank" className="text-gray-500">
          <ShareIcon />
        </a>
      </div>

      <div className="pt-4">
        {type === "youtube" && (
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${getYouTubeId(link)}`}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {type === "twitter" && (
          <blockquote className="twitter-tweet">
            <a href={link.replace("x.com", "twitter.com")}></a>
          </blockquote>
        )}
      </div>
    </div>
  );
}

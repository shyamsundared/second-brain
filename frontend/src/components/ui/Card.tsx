import { useEffect } from "react";
import { ArrowTopRightOnSquareIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import { VideoIcon } from "../../icons/VideoIcon";
import { TweetIcon } from "../../icons/TweetIcon";
import { DocumentLink } from "../../icons/DocumentIcon";
import { kindOf, type Content } from "../../lib/content";

declare global {
  interface Window {
    twttr?: { widgets: { load: () => void } };
  }
}

interface CardProps {
  title: string;
  link: string;
  tags?: string[];
  status?: Content["status"];
  // From search: start the video at the matching moment and show what's said there
  momentSeconds?: number | null;
  momentText?: string | null;
  onTagClick?: (tag: string) => void;
  // Leave these out for read-only cards (e.g. on a shared page)
  onDelete?: () => void;
  onSimilar?: () => void;
}

// "https://www.youtube.com/watch?v=abc123" -> "abc123"
// "https://youtu.be/abc123"                -> "abc123"
// "https://www.youtube.com/shorts/abc123"  -> "abc123"
function getYouTubeId(link: string) {
  const url = new URL(link);
  if (url.hostname === "youtu.be") return url.pathname.slice(1);
  if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2];
  return url.searchParams.get("v");
}

// 754 -> "12:34", 3754 -> "1:02:34"
function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

const iconButton = "text-gray-400 hover:text-blued";

export function Card({ title, link, tags = [], status = "ready", momentSeconds, momentText, onTagClick, onDelete, onSimilar }: CardProps) {
  const kind = kindOf(link);
  const videoId = kind === "youtube" ? getYouTubeId(link) : null;
  const hasMoment = kind === "youtube" && momentSeconds != null;

  // Load Twitter's script once, or ask it to re-scan if it's already loaded
  useEffect(() => {
    if (kind !== "twitter") return;
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
  }, [kind, link]);

  return (
    <div className="bg-white w-72 min-h-40 shadow-md border border-gray-200 rounded-md p-4 flex flex-col">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 text-sm font-medium min-w-0">
          <div className="pt-0.5 text-gray-500 shrink-0">
            {kind === "youtube" ? <VideoIcon /> : kind === "twitter" ? <TweetIcon /> : <DocumentLink />}
          </div>
          <span className="line-clamp-2 wrap-break-word">{title}</span>
        </div>
        {(status === "pending" || status === "processing") && (
          <span className="shrink-0 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 animate-pulse">Indexing…</span>
        )}
        {status === "failed" && (
          <span className="shrink-0 text-xs text-red-600 bg-red-50 rounded-full px-2 py-0.5" title="Couldn't fetch this link's text. Only the title is searchable.">
            Not indexed
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {onSimilar && (
            <button type="button" onClick={onSimilar} title="Show similar" className={iconButton}>
              <SparklesIcon className="size-4" />
            </button>
          )}
          <a href={link} target="_blank" rel="noreferrer" title="Open link" className={iconButton}>
            <ArrowTopRightOnSquareIcon className="size-4" />
          </a>
          {onDelete && (
            <button type="button" onClick={onDelete} title="Delete" className="text-gray-400 hover:text-red-600">
              <TrashIcon className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="pt-4">
        {kind === "youtube" && (
          <iframe
            className="w-full aspect-video"
            // Search results start the embedded video at the matching moment
            src={`https://www.youtube.com/embed/${videoId}${hasMoment ? `?start=${momentSeconds}` : ""}`}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {hasMoment && (
          <a
            href={`https://www.youtube.com/watch?v=${videoId}&t=${momentSeconds}s`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs text-gray-600 hover:text-blued"
          >
            <span className="font-medium text-blued">▶ {formatTime(momentSeconds)}</span>{" "}
            <span className="line-clamp-2">“{momentText}…”</span>
          </a>
        )}

        {kind === "twitter" && (
          <blockquote className="twitter-tweet">
            <a href={link.replace("x.com", "twitter.com")}></a>
          </blockquote>
        )}

        {kind === "article" && (
          <a href={link} target="_blank" rel="noreferrer" className="block text-sm text-blued underline break-all">
            {new URL(link).hostname}
          </a>
        )}
      </div>

      {tags.length > 0 && (
        <div className="pt-3 mt-auto flex flex-wrap gap-1">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick?.(tag)}
              className="text-xs bg-bluel text-blued rounded-full px-2 py-0.5 hover:bg-blued hover:text-white"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

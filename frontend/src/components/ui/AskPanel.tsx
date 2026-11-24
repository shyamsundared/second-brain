import { useState, type FormEvent } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { api, formatTime, getYouTubeId, kindOf } from "../../lib/content";
import { Button } from "./Button";

interface Source {
  contentId: number;
  title: string;
  link: string;
  startSeconds: number | null;
  quote: string;
}

interface Answer {
  parts: { text: string; sources: Source[] }[];
}

// Videos open at the cited moment, everything else at its link
function sourceUrl(s: Source) {
  if (kindOf(s.link) === "youtube" && s.startSeconds != null) {
    return `https://www.youtube.com/watch?v=${getYouTubeId(s.link)}&t=${s.startSeconds}s`;
  }
  return s.link;
}

export function AskPanel({ onSignout }: { onSignout: () => void }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setAnswer(null);
    setLoading(true);
    try {
      const res = await api("/api/v1/ask", { method: "POST", body: JSON.stringify({ question }) });
      if (res.status === 401) return onSignout();
      const data = await res.json();
      if (!res.ok) setError(data.message ?? "Couldn't get an answer");
      else setAnswer(data);
    } catch {
      setError("Can't reach the server");
    } finally {
      setLoading(false);
    }
  }

  // Number each distinct source once, in the order it's first cited, like footnotes
  const sources: Source[] = [];
  const numberOf = (s: Source) => {
    let i = sources.findIndex((x) => x.contentId === s.contentId && x.startSeconds === s.startSeconds);
    if (i === -1) i = sources.push(s) - 1;
    return i + 1;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your brain, e.g. what did I save about building habits?"
          required
          minLength={3}
          maxLength={500}
          autoFocus
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blued"
        />
        <Button type="submit" variant="primary" size="lg" disabled={loading} startIcon={<SparklesIcon className="size-4" />} className="disabled:opacity-60">
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </form>

      {error && <p className="pt-3 text-sm text-red-600">{error}</p>}

      {answer && (
        <div className="pt-4 text-sm">
          <p className="leading-relaxed whitespace-pre-wrap">
            {answer.parts.map((part, i) => (
              <span key={i}>
                {part.text}
                {[...new Set(part.sources.map(numberOf))].map((n) => (
                  <sup key={n} className="text-blued font-medium px-0.5">[{n}]</sup>
                ))}
              </span>
            ))}
          </p>

          {sources.length > 0 && (
            <ol className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
              {sources.map((s, i) => (
                <li key={i} className="text-xs text-gray-600">
                  <a href={sourceUrl(s)} target="_blank" rel="noreferrer" className="hover:text-blued">
                    <span className="font-medium text-blued">[{i + 1}] {s.title}</span>
                    {s.startSeconds != null && kindOf(s.link) === "youtube" && <span> ▶ {formatTime(s.startSeconds)}</span>}
                    <span className="block line-clamp-2">“{s.quote}”</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

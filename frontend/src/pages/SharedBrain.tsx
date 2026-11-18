import { useEffect, useState } from "react";
import { BrainIcon } from "../icons/Brain";
import { Card } from "../components/ui/Card";
import type { Content } from "../lib/content";

// Public, read-only view of someone's brain at /share/<hash>. No login needed.
export function SharedBrain({ hash }: { hash: string }) {
  const [brain, setBrain] = useState<{ username: string; data: Content[] } | "loading" | "missing">("loading");

  useEffect(() => {
    fetch(`/api/v1/brain/${hash}`).then(async (res) => {
      setBrain(res.ok ? await res.json() : "missing");
    });
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 text-blued">
          <BrainIcon width={36} height={36} />
          <span className="text-xl font-medium">
            {typeof brain === "object" ? `${brain.username}'s brain` : "Second Brain"}
          </span>
        </div>
        <a href="/" className="text-sm text-blued font-medium">Make your own →</a>
      </header>

      <main className="px-6 py-6 flex flex-wrap items-start gap-4">
        {brain === "loading" && <p className="text-gray-500 text-sm">Loading...</p>}
        {brain === "missing" && <p className="text-gray-500 text-sm">This share link doesn't exist or was turned off.</p>}
        {typeof brain === "object" && (brain.data.length
          ? brain.data.map((c) => <Card key={c.id} title={c.title} link={c.link} tags={c.tags} />)
          : <p className="text-gray-500 text-sm">Nothing here yet.</p>)}
      </main>
    </div>
  );
}

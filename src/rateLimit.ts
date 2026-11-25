import type { Request, Response, NextFunction } from "express";

// Allows `max` requests per `windowMs` for each key (an IP or a user), then answers 429.
// Counts live in memory, which is fine for a single server. With several servers,
// move them to Redis or Postgres so the limit is shared.
export function rateLimit(max: number, windowMs: number, keyOf: (req: Request) => string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  // Forget expired windows now and then, so the map doesn't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyOf(req);
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ message: "Too many requests, try again later" });
      return;
    }
    entry.count++;
    next();
  };
}

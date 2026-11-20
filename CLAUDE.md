# Brainly

A "second brain" app: users save links (tweets, YouTube videos, articles), tag them, and share their collection via a public link.

- Backend: Express 5 + Prisma 7 (Postgres via `@prisma/adapter-pg`), TypeScript ESM. Code in `src/`.
- Frontend: React 19 + Vite + Tailwind 4. Code in `frontend/src/`.

## Commands
- Backend: `npm run dev` (build + start), `npm run typecheck`
- Frontend: `cd frontend && npm run dev`, `npm run lint`
- Database: `docker start brainly-postgres` (`pgvector/pgvector:pg18` image, port 5433)
- Re-index everything (e.g. after changing chunking): `UPDATE "Content" SET status='pending', attempts=0;` — the worker picks it up
- `.env` needs `DATABASE_URL`, `JWT_SECRET`, `YOUTUBE_API_KEY`
- After changing `prisma/schema.prisma`: `npm run db:migrate -- --name <name>`, then `npm run db:generate`
- Prisma client is generated into `src/generated/prisma` (gitignored). Import it via `src/lib/prisma.ts`.

## Code style
- Write the simplest code that works. No abstractions until something is repeated 3 times.
- No defensive code for cases that can't happen. Only add try/catch where there's a real failure to handle.
- Prefer short, plain functions over helpers, generics, or config objects.
- Don't add libraries when a few lines of plain code will do.
- Comments only where the *why* isn't obvious. Never restate what the code says.
- Match the existing style of the file you're editing.
- Keep changes scoped to what was asked. Mention other problems instead of fixing them unasked.

## Backend conventions
- Routes live in `src/index.ts` under `/api/v1/`. Protected routes use the `auth` middleware, which sets `req.userId`.
- Every route must send a response on every path (including errors). Use proper status codes: 400 bad input, 401 auth, 404 not found.
- Always scope queries by `userId` so users can only touch their own content.
- Raw SQL is only for things Prisma can't do. Use tagged `prisma.$queryRaw` templates, never string concatenation.
- Validate request bodies with the zod schemas in `src/types.ts`.
- Saving content only inserts a `pending` row. The background worker (`src/ingest/worker.ts`, started from `index.ts`) fetches text/transcripts, splits them into `Chunk`s (~45s of transcript each, with `startSeconds`), embeds them and marks the row `ready` (or `failed` after 3 attempts). The queue is the Content table, claimed with `FOR UPDATE SKIP LOCKED`.
- `Content.embedding` and `Chunk.embedding` are pgvector columns (all-MiniLM-L6-v2, 384 dims, runs locally via `src/ingest/embed.ts`). Prisma can't read them, so use raw SQL; `<=>` is cosine distance. Content-level vectors power "similar items"; chunk vectors power search.
- Search is hybrid: full-text + chunk-vector results merged with Reciprocal Rank Fusion (`/api/v1/search`), and each result carries the best matching moment (`momentSeconds`, `momentText`).

## Frontend conventions
- Reusable UI in `frontend/src/components/ui/`, pages in `frontend/src/pages/`, icons in `frontend/src/icons/`.
- Icons wrap Heroicons and use `iconVariants` + `cn()` for sizing (see `plusicon.tsx`).
- Style with Tailwind classes only.

## Explanations
- Short and direct. Say what changed and why, no long intros or recaps.

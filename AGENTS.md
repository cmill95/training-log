<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Training Log

Next.js app where coaches create and assign workouts and athletes log completions;
a dashboard shows athlete progress. Learning project: explain non-obvious choices.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS 4: config lives in `src/app/globals.css` (`@theme`), no tailwind.config.js
- Postgres on Neon, accessed via Drizzle ORM
- Auth.js for login; users have a `role`: "coach" | "athlete"
- Vercel (deploys), GitHub Actions (CI)

## Commands

- `npm run dev`: dev server at localhost:3000
- `npm run lint` / `npm run typecheck` / `npm run format:check`: must all pass before you report a task done
- `npm run format`: fix formatting
- `npm run build`: production build (also type-checks)

## Structure

- `src/app/`: routes (`page.tsx`), layouts, colocated server actions (`actions.ts`)
- `src/db/`: Drizzle schema and client (planned)
- `src/lib/`: shared, framework-free logic (unit-tested) (planned)
- `src/components/`: UI shared across routes

## Conventions

- Server Components by default; add `"use client"` only for interactivity
- Mutations use Server Actions, not API routes
- Every server action: check session + role, validate input with Zod, then touch the DB
- Database access only in server code, never in client components
- Every page needs loading, error, and empty states

## Testing & CI

- Pre-commit hook runs lint-staged + typecheck; never bypass it with `--no-verify`
- CI must be green before merging to `main`

## Boundaries

- Do not commit, push, or create branches unless I ask
- Never commit `.env*` files or print secrets
- Never edit generated files: `.next/`, `next-env.d.ts`, `package-lock.json` (by hand)
- Never edit an applied migration; generate a new one
- Ask before adding a new dependency

## Gotchas

- `typecheck` runs `next typegen` first: route types (`LayoutProps`, `PageProps`)
  live in `.next/types/` and don't exist in a fresh clone otherwise
- Next 16 renamed `<Image priority>` to `preload`

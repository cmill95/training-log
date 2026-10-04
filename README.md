# Training Log

[![CI](https://github.com/cmill95/training-log/actions/workflows/ci.yml/badge.svg)](https://github.com/cmill95/training-log/actions/workflows/ci.yml)

A full-stack TypeScript app for coaches and athletes. Coaches create workouts and assign them,
athletes log what they completed, and a dashboard shows each athlete's progress over time.

**Live:** https://training-log-ashy.vercel.app

> 🚧 **In progress.** The foundation is done: deployment, CI/CD, and the database schema.
> Auth and the coach/athlete features are next.

## Stack

| Layer     | Choice                                          |
| --------- | ----------------------------------------------- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling   | Tailwind CSS 4                                  |
| Database  | Postgres on Neon · Drizzle ORM · node-postgres  |
| Auth      | Auth.js _(planned)_                             |
| Quality   | ESLint · Prettier · Husky + lint-staged         |
| CI/CD     | GitHub Actions · Vercel (preview + production)  |

## Getting started

Requires Node.js 22 and a Postgres database.

```bash
npm install
```

Create `.env.local` with your connection strings:

```bash
DATABASE_URL="postgresql://..."           # pooled, used by the app
DATABASE_URL_UNPOOLED="postgresql://..."  # direct, used for migrations
```

If you have access to the Vercel project, `npx vercel link && npx vercel env pull .env.local` does this for you.

Then apply the schema and start the dev server:

```bash
npm run db:migrate
npm run dev            # http://localhost:3000
```

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Dev server with Fast Refresh                     |
| `npm run build`        | Production build (also type-checks)              |
| `npm run lint`         | ESLint                                           |
| `npm run format`       | Format everything with Prettier                  |
| `npm run format:check` | Check formatting without changing files          |
| `npm run typecheck`    | Generate route types, then `tsc --noEmit`        |
| `npm run db:generate`  | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate`   | Apply pending migrations                         |

## Database

Four tables, with the rules enforced by Postgres itself (unique emails, a `role` enum,
non-negative sets/reps/duration, foreign keys):

```
users ──< workouts ──< assignments >── users
                            │
                            └──< logs   (at most one per assignment)
```

- **No stored status:** an assignment is complete when it has a log, and overdue when its `due_date` has passed without one.
- **History is protected:** a workout that has been assigned can't be deleted.
- Migrations are generated SQL files in `drizzle/`, reviewed in PRs. Applied migrations are never edited.

## Development workflow

`main` is protected: every change goes through a pull request.

1. **On commit:** a pre-commit hook formats and lints the staged files, then type-checks the project.
2. **On every PR:** GitHub Actions runs Lint, Format, Typecheck and Build in parallel. All four must pass to merge.
3. **Preview:** Vercel deploys each PR to its own URL, backed by its own Neon database branch.
4. **Merge:** PRs are squash-merged, and Vercel deploys `main` to production.

## Known limitations

- No teams yet: any coach can assign workouts to any athlete.
- Workouts are free text rather than structured exercises.

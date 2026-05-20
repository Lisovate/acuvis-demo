# acuvis-demo

A small URL shortener used as a public demo for [acuvis](https://acuvis.io) code review.

## Stack

- **API** — Fastify + TypeScript + `better-sqlite3` + JWT auth
- **Web** — React 18 + Vite + TypeScript + Tailwind CSS + React Router
- **Shared** — Zod schemas and TypeScript types shared between client and server
- **Tooling** — pnpm workspaces

## Layout

```
apps/
  api/      Fastify backend
  web/      React frontend
packages/
  shared/   Zod schemas + shared types
```

## Getting started

```sh
pnpm install
pnpm --filter @acuvis-demo/api dev   # http://localhost:4000
pnpm --filter @acuvis-demo/web dev   # http://localhost:5173
```

The API uses a local SQLite file at `apps/api/data/app.sqlite` (auto-created on first run).

## Features

- Register / login (JWT, stored in `localStorage`)
- Create short links with optional custom slug
- Optional link expiration (`expiresAt`)
- Optional password-protected links
- Public redirect endpoint at `GET /:slug`
- Per-link click analytics (last 30 days, top referrers)
- Per-user rate limit on link creation
- Dashboard listing your own links, with delete + copy-to-clipboard

See open PRs for in-flight work.

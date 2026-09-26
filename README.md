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

The API uses a local SQLite file at `apps/api/data/app.sqlite` (auto-created on first run). Schema changes live in `apps/api/src/migrations` and run on boot.

API requests that work inside a workspace send its id in the `X-Workspace-Id` header.

### API configuration

| Variable | Default | What it does |
|---|---|---|
| `PUBLIC_WEB_URL` | `http://localhost:5173` | Base URL used in invite links |
| `INVITE_TTL_DAYS` | `7` | How long an invite stays valid |
| `WEBHOOK_TIMEOUT_MS` | `10000` | Timeout for one webhook delivery attempt |
| `WEBHOOK_MAX_ATTEMPTS` | `5` | Delivery attempts before a webhook delivery is marked failed |

```sh
pnpm --filter @acuvis-demo/api test
```

## Features

- Register / login (JWT, stored in `localStorage`)
- Workspaces: every account gets a personal one; create shared ones and invite teammates as owner, admin or member
- Create short links with optional custom slug, shared across the workspace
- Public redirect endpoint at `GET /:slug`
- Signed webhooks for `link.created`, `link.clicked` and `link.deleted` (see [docs/webhooks.md](docs/webhooks.md))

See open PRs for in-flight work.

# acuvis-demo-api (Go)

URL shortener API in Go — chi router + database/sql with SQLite + golang-jwt
for tokens. Mirrors the TypeScript port under `apps/api` (on `main`) so
reviewers can compare Acuvis's review across language stacks.

## Stack

- **chi** (HTTP routing)
- **database/sql** + `github.com/mattn/go-sqlite3` (SQLite driver)
- **golang-jwt/jwt/v5** for JWT issue/verify
- **golang.org/x/crypto/bcrypt** for user passwords

## Running

```sh
cd apps/api-go
go run ./cmd/server
```

Defaults to port 4000. SQLite file at `data/app.sqlite`, auto-created.

## Endpoints

- `POST /auth/register` — create a user
- `POST /auth/login` — issue JWT
- `POST /links` — create short link (auth required)
- `GET /links` — list caller's links (auth required)
- `GET /{slug}` — redirect to the long URL

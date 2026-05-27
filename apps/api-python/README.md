# acuvis-demo-api (Python)

URL shortener API in Python — FastAPI + SQLAlchemy + python-jose. Mirrors the
TypeScript port under `apps/api` (on `main`) so reviewers can compare how
Acuvis triages the same feature set across stacks.

## Stack

- **FastAPI** (async HTTP + Pydantic validation)
- **SQLAlchemy 2.x** with the `sqlite:///./data/app.sqlite` driver
- **python-jose** for JWT issuance/verification
- **passlib** (bcrypt) for password hashing

## Running

```sh
cd apps/api-python
uv sync          # or: pip install -e .
uvicorn app.main:app --reload --port 4000
```

The SQLite file is auto-created at first request (`data/app.sqlite`).

## Endpoints

- `POST /auth/register` — create a user
- `POST /auth/login` — issue JWT
- `POST /links` — create short link (auth required)
- `GET /links` — list caller's links (auth required)
- `GET /:slug` — redirect to the long URL

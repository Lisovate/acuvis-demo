from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .db import init_db
from .middleware.rate_limit import rate_limit_middleware
from .routes import analytics, auth, links, redirect


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run schema migrations at process start. Idempotent."""

    init_db()
    yield


app = FastAPI(title="acuvis-demo-api", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

app.include_router(auth.router)
app.include_router(links.router)
app.include_router(analytics.router)
# Redirect router has no prefix — `/:slug` is the bare path.
app.include_router(redirect.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}

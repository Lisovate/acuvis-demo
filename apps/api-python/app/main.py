from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .routes import auth, links, redirect


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run schema migrations at process start. Idempotent."""

    init_db()
    yield


app = FastAPI(title="acuvis-demo-api", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(links.router)
# Redirect router has no prefix — `/:slug` is the bare path.
app.include_router(redirect.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    """Declarative base for ORM models. Tables register on subclass import."""


# `check_same_thread=False` is required for sqlite + threaded request handlers.
# Production deployments should swap the driver to Postgres or MySQL via
# DATABASE_URL — the application code is engine-agnostic.
_db_path = Path(settings.database_url.replace("sqlite:///", ""))
_db_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency. Opens a session per request, closes on exit."""

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    """Create tables if they don't exist. Called once on app startup."""

    # Import models so their Table objects register against Base.metadata.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

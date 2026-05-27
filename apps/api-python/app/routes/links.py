import secrets
import string
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_session
from ..deps import current_user
from ..lib.passwords import hash_link_password
from ..models import Link, User
from ..schemas.link import CreateLinkRequest, LinkResponse

router = APIRouter(prefix="/links", tags=["links"])

_SLUG_ALPHABET = string.ascii_letters + string.digits


def _generate_slug(length: int = 8) -> str:
    """URL-safe random slug. Collision check happens at insert time."""

    return "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(length))


def _to_response(link: Link) -> LinkResponse:
    return LinkResponse(
        id=link.id,
        slug=link.slug,
        target_url=link.target_url,
        created_at=link.created_at,
        expires_at=link.expires_at,
        password_protected=link.password_hash is not None,
    )


@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(
    payload: CreateLinkRequest,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(current_user)],
) -> LinkResponse:
    slug = payload.slug or _generate_slug()
    existing = session.query(Link).filter(Link.slug == slug).first()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="slug already in use")
    link = Link(
        slug=slug,
        target_url=str(payload.target_url),
        owner_id=user.id,
        expires_at=payload.expires_at,
        password_hash=hash_link_password(payload.password) if payload.password else None,
    )
    session.add(link)
    session.commit()
    session.refresh(link)
    return _to_response(link)


@router.get("", response_model=list[LinkResponse])
def list_links(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(current_user)],
) -> list[LinkResponse]:
    rows = (
        session.query(Link)
        .filter(Link.owner_id == user.id)
        .order_by(Link.created_at.desc())
        .all()
    )
    return [_to_response(row) for row in rows]

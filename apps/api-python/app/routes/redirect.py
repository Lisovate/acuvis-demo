from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..db import get_session
from ..lib.clicks import record_click
from ..lib.passwords import verify_link_password
from ..models import Link

router = APIRouter(tags=["redirect"])


@router.get("/{slug}", include_in_schema=False)
def redirect(
    slug: str,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    password: Annotated[str | None, Query()] = None,
) -> RedirectResponse:
    link = session.query(Link).filter(Link.slug == slug).first()
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="link not found")

    # Expiration check. Links with NULL expires_at never expire.
    if link.expires_at is not None and link.expires_at < datetime.utcnow():
        raise HTTPException(status.HTTP_410_GONE, detail="link expired")

    # Password gate.
    if link.password_hash is not None:
        if password is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="password required")
        if not verify_link_password(password, link.password_hash):
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="invalid password")

    # Record the click before issuing the redirect — analytics are
    # eventually-consistent but writing inline keeps the demo simple.
    record_click(
        session=session,
        link_id=link.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        referer=request.headers.get("referer"),
    )

    return RedirectResponse(url=link.target_url, status_code=status.HTTP_302_FOUND)

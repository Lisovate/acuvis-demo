from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Link

router = APIRouter(tags=["redirect"])


@router.get("/{slug}", include_in_schema=False)
def redirect(
    slug: str,
    session: Annotated[Session, Depends(get_session)],
) -> RedirectResponse:
    link = session.query(Link).filter(Link.slug == slug).first()
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="link not found")
    return RedirectResponse(url=link.target_url, status_code=status.HTTP_302_FOUND)

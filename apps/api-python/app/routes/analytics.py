from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_session
from ..deps import current_user
from ..models import Click, Link, User
from ..schemas.analytics import AnalyticsResponse, ClickPoint

router = APIRouter(prefix="/links", tags=["analytics"])

# How many recent click rows to embed in the response. Caller can paginate
# further via a future cursor endpoint; this view is for the sparkline.
RECENT_CLICKS_LIMIT = 100


@router.get("/{link_id}/analytics", response_model=AnalyticsResponse)
def link_analytics(
    link_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(current_user)],
) -> AnalyticsResponse:
    link = session.get(Link, link_id)
    if link is None or link.owner_id != user.id:
        # Same body for "doesn't exist" and "not yours" so we don't leak
        # the existence of other tenants' links.
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="link not found")

    recent = (
        session.query(Click)
        .filter(Click.link_id == link.id)
        .order_by(Click.occurred_at.desc())
        .limit(RECENT_CLICKS_LIMIT)
        .all()
    )
    total = session.query(Click).filter(Click.link_id == link.id).count()
    last_click_at = recent[0].occurred_at if recent else None

    return AnalyticsResponse(
        link_id=link.id,
        slug=link.slug,
        total_clicks=total,
        last_click_at=last_click_at,
        recent_clicks=[
            ClickPoint(
                timestamp=c.occurred_at,
                ip_address=c.ip_address,
                user_agent=c.user_agent,
                referer=c.referer,
            )
            for c in recent
        ],
    )

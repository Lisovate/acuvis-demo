from sqlalchemy.orm import Session

from ..models import Click


def record_click(
    *,
    session: Session,
    link_id: int,
    ip_address: str | None,
    user_agent: str | None,
    referer: str | None,
) -> None:
    """Persist a click event for a successful redirect.

    Called inline from the redirect handler — fast enough on SQLite for
    the demo scale; production should swap this to an async queue
    (Redis / SQS) so a slow database doesn't slow the redirect.
    """

    click = Click(
        link_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referer=referer,
    )
    session.add(click)
    session.commit()

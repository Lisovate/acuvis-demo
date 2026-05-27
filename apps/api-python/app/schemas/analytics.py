from datetime import datetime

from pydantic import BaseModel


class ClickPoint(BaseModel):
    """Single sample for the sparkline."""

    timestamp: datetime
    ip_address: str | None
    user_agent: str | None
    referer: str | None


class AnalyticsResponse(BaseModel):
    link_id: int
    slug: str
    total_clicks: int
    last_click_at: datetime | None
    recent_clicks: list[ClickPoint]

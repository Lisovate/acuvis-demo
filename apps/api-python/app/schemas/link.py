from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class CreateLinkRequest(BaseModel):
    target_url: HttpUrl
    slug: str | None = Field(default=None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")


class LinkResponse(BaseModel):
    id: int
    slug: str
    target_url: str
    created_at: datetime

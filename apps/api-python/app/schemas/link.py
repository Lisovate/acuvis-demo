from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class CreateLinkRequest(BaseModel):
    target_url: HttpUrl
    slug: str | None = Field(default=None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    # NULL → never expires. Aware UTC datetimes preferred; naive values
    # are coerced to UTC by Pydantic.
    expires_at: datetime | None = None
    # When set, the redirect requires the visitor to pass ?password=...
    # The plaintext is hashed before persisting.
    password: str | None = Field(default=None, min_length=4, max_length=64)


class LinkResponse(BaseModel):
    id: int
    slug: str
    target_url: str
    created_at: datetime
    expires_at: datetime | None
    password_protected: bool

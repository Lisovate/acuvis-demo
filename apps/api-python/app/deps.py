from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .auth import decode_token
from .db import get_session
from .models import User


def current_user(
    authorization: Annotated[str | None, Header()] = None,
    session: Annotated[Session, Depends(get_session)] = None,
) -> User:
    """Extract the bearer token, decode it, return the User row.

    Raises 401 on missing/invalid auth — the global exception handler maps
    that to a JSON error body the React client knows how to render.
    """

    if authorization is None or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_token(token)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="user not found")
    return user

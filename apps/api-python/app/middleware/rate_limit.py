import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse

# Maximum requests per IP per window. Picked at the API tier — generous
# enough for normal use, tight enough that a script can't brute-force.
RATE_LIMIT_MAX = 60
RATE_LIMIT_WINDOW_SECONDS = 60

# Process-local sliding window. Keys = client IP, values = list of
# epoch-second timestamps of recent requests within the window. We trim
# the list on each request before counting.
_counters: dict[str, list[float]] = {}


async def rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """ASGI middleware that gates POST /links by IP-bucketed sliding window.

    Other endpoints pass through unmetered — link creation is the main
    write-amplification risk on this API. Login is metered separately
    via the session lockout in the auth router (TODO: not yet wired).
    """

    # Skip non-create paths to keep the path cheap on the redirect hot path.
    if not (request.method == "POST" and request.url.path == "/links"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    history = _counters.setdefault(client_ip, [])
    # Drop timestamps outside the window — keeps the list bounded by traffic.
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    while history and history[0] < cutoff:
        history.pop(0)

    if len(history) >= RATE_LIMIT_MAX:
        return JSONResponse(
            {"detail": "rate limit exceeded; please slow down"},
            status_code=429,
            headers={"retry-after": str(RATE_LIMIT_WINDOW_SECONDS)},
        )

    history.append(now)
    return await call_next(request)

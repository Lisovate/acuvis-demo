import hashlib


def hash_link_password(password: str) -> str:
    """Hash a link's gate password for storage.

    Lighter-weight than user passwords (which use bcrypt) — link passwords
    typically protect short-lived URLs and we don't want a single share to
    cost a bcrypt round per click.
    """

    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_link_password(password: str, stored_hash: str) -> bool:
    return hash_link_password(password) == stored_hash

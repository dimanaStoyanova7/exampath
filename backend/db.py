import os
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_KEY", ""),
        )
    return _client


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_session(session_id: str) -> dict | None:
    res = _get_client().table("sessions").select("*").eq("session_id", session_id).execute()
    return res.data[0] if res.data else None


def create_session(session_id: str, topics: list, full_text: str) -> None:
    _get_client().table("sessions").insert({
        "session_id": session_id,
        "topics": topics,
        "full_text": full_text,
        "last_accessed": _now(),
    }).execute()


def update_session(session_id: str, **fields) -> None:
    _get_client().table("sessions").update(
        {**fields, "last_accessed": _now()}
    ).eq("session_id", session_id).execute()


def touch_session(session_id: str) -> None:
    _get_client().table("sessions").update(
        {"last_accessed": _now()}
    ).eq("session_id", session_id).execute()


def delete_session(session_id: str) -> None:
    _get_client().table("sessions").delete().eq("session_id", session_id).execute()

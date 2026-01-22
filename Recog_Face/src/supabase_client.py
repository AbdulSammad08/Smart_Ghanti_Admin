"""Supabase client helpers for visitor embeddings."""

import json
from functools import lru_cache
from typing import Any, Dict, List

from dotenv import load_dotenv
from supabase import Client, create_client

from .config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_VISITORS_TABLE

load_dotenv()


class SupabaseConfigError(RuntimeError):
    """Raised when Supabase credentials are missing."""


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached Supabase client instance."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise SupabaseConfigError("Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def fetch_active_visitors_with_embeddings() -> List[Dict[str, Any]]:
    """Fetch active visitors that have embeddings from Supabase."""
    client = get_supabase_client()
    try:
        response = (
            client.table(SUPABASE_VISITORS_TABLE)
            .select("id,name,status,face_embeddings,metadata")
            .eq("status", "active")
            .execute()
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch visitors from Supabase: {exc}") from exc

    visitors: List[Dict[str, Any]] = []
    for row in response.data or []:
        embeddings = row.get("face_embeddings") or []

        if isinstance(embeddings, str):
            try:
                embeddings = json.loads(embeddings)
            except Exception:
                embeddings = []

        if embeddings:
            row["face_embeddings"] = embeddings
            visitors.append(row)

    return visitors

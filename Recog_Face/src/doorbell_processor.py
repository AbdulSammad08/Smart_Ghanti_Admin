"""Doorbell event processing that compares incoming faces with Supabase embeddings.

This module is made resilient when `face_recognition`/`dlib` are missing. It will
return a clear error instead of crashing so the rest of the API stays usable.
"""

import base64
import importlib
import io
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image

from .config import FACE_MATCH_THRESHOLD, LOG_DETAILED_COMPARISONS
from .supabase_client import fetch_active_visitors_with_embeddings


def _load_face_recognition():
    """Lazy import face_recognition with a helpful error if missing."""
    try:
        return importlib.import_module("face_recognition")
    except ImportError as exc:
        raise ImportError(
            "face_recognition (dlib) is not installed. Install a Windows wheel for dlib and rerun."
        ) from exc


def extract_face_encoding_from_base64(base64_image: str) -> Optional[np.ndarray]:
    """Decode a base64 image and return the first face encoding, if any."""
    fr = _load_face_recognition()
    try:
        image_bytes = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        frame = np.array(image)
    except Exception as exc:
        raise ValueError(f"Invalid base64 image data: {exc}") from exc

    face_locations = fr.face_locations(frame)
    if not face_locations:
        return None

    encodings = fr.face_encodings(frame, face_locations)
    if not encodings:
        return None

    return encodings[0]


def _normalize_embeddings(raw_embeddings: Any) -> List[np.ndarray]:
    """Normalize embeddings from Supabase rows into numpy arrays."""
    normalized: List[np.ndarray] = []
    for emb in raw_embeddings or []:
        try:
            normalized.append(np.asarray(emb, dtype=np.float64))
        except Exception:
            continue
    return normalized


def recognize_face_from_doorbell(base64_image: str) -> Dict[str, Any]:
    """Compare a doorbell image against all Supabase visitor embeddings."""
    try:
        fr = _load_face_recognition()
    except ImportError as exc:
        return {
            "recognized": False,
            "name": "Unknown",
            "confidence": 0.0,
            "authorized": False,
            "error": str(exc),
            "dependency_missing": "face_recognition/dlib",
        }

    doorbell_encoding = extract_face_encoding_from_base64(base64_image)
    if doorbell_encoding is None:
        return {
            "recognized": False,
            "name": "Unknown",
            "confidence": 0.0,
            "authorized": False,
            "error": "No face detected in doorbell image",
        }

    visitors = fetch_active_visitors_with_embeddings()
    if not visitors:
        return {
            "recognized": False,
            "name": "Unknown",
            "confidence": 0.0,
            "authorized": False,
            "error": "No active visitors with embeddings in Supabase",
        }

    best_match: Optional[Dict[str, Any]] = None
    best_distance: float = 1.0
    comparisons: List[Dict[str, Any]] = []

    for visitor in visitors:
        embeddings = _normalize_embeddings(visitor.get("face_embeddings"))
        if not embeddings:
            continue

        distances = fr.face_distance(embeddings, doorbell_encoding)
        min_distance = float(np.min(distances))
        confidence = max(0.0, 1.0 - min_distance)

        if LOG_DETAILED_COMPARISONS:
            comparisons.append(
                {
                    "visitor_id": visitor.get("id"),
                    "visitor_name": visitor.get("name"),
                    "min_distance": min_distance,
                    "confidence": confidence,
                    "num_photos": len(embeddings),
                }
            )

        if min_distance < best_distance:
            best_distance = min_distance
            best_match = {
                "visitor": visitor,
                "distance": min_distance,
                "confidence": confidence,
            }

    threshold = FACE_MATCH_THRESHOLD
    if best_match and best_distance < threshold:
        visitor_data = best_match["visitor"]
        authorized = str(visitor_data.get("status", "")).lower() == "active"
        return {
            "recognized": True,
            "name": visitor_data.get("name", "Unknown"),
            "visitor_id": visitor_data.get("id"),
            "confidence": best_match["confidence"],
            "authorized": authorized,
            "distance": best_distance,
            "comparisons": comparisons if LOG_DETAILED_COMPARISONS else None,
        }

    return {
        "recognized": False,
        "name": "Unknown",
        "confidence": 0.0,
        "authorized": False,
        "distance": best_distance,
        "best_match_name": best_match["visitor"].get("name") if best_match else None,
        "comparisons": comparisons if LOG_DETAILED_COMPARISONS else None,
    }

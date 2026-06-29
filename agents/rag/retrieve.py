"""RAG retrieval — vector search over the AlloyDB education corpus (Track 3 reuse).

`retrieve(query, level)` embeds the query and returns the top-k nearest chunks via pgvector
cosine distance. If AlloyDB / Vertex aren't configured (local demo), returns None so callers
fall back to the curated corpus file directly — the UI's education + chat always work.
"""

from __future__ import annotations

import os
from typing import Optional


def _embed_query(query: str) -> Optional[list[float]]:
    try:
        import vertexai
        from vertexai.language_models import TextEmbeddingModel
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not project:
            return None
        vertexai.init(project=project, location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"))
        model = TextEmbeddingModel.from_pretrained(os.getenv("EMBED_MODEL", "text-embedding-004"))
        return model.get_embeddings([query])[0].values
    except Exception:
        return None


def retrieve(query: str, level: str = "smt", k: int = 4) -> Optional[str]:
    """Return concatenated top-k corpus chunks for the query, or None if RAG isn't configured."""
    conn_str = os.getenv("ALLOYDB_CONN")
    vec = _embed_query(query)
    if not conn_str or vec is None:
        return None
    try:
        import psycopg2
        conn = psycopg2.connect(conn_str)
        with conn, conn.cursor() as cur:
            cur.execute(
                "SELECT chunk FROM education_chunks "
                "WHERE level = %s OR %s = 'any' "
                "ORDER BY embedding <=> %s::vector LIMIT %s",
                (level, level, vec, k),
            )
            chunks = [r[0] for r in cur.fetchall()]
        return "\n\n---\n\n".join(chunks) if chunks else None
    except Exception:
        return None

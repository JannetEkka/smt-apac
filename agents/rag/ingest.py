"""RAG ingestion — embed the education corpus into AlloyDB + pgvector (Track 3 reuse).

Reads agents/rag/corpus/*.md, chunks them, embeds with Vertex AI text-embeddings, and upserts
into an AlloyDB `education_chunks` table with a vector column. Run once to seed the knowledge base:

    GOOGLE_CLOUD_PROJECT=smt-bot-2026-v2 \
    ALLOYDB_CONN="postgresql://user:pass@host:5432/smtworld" \
    python -m agents.rag.ingest

Schema:
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE education_chunks (
    id        bigserial PRIMARY KEY,
    level     text,                 -- smt | trading | crypto
    source    text,
    chunk     text,
    embedding vector(768)
  );
  CREATE INDEX ON education_chunks USING ivfflat (embedding vector_cosine_ops);
"""

from __future__ import annotations

import os
from pathlib import Path

CORPUS = Path(__file__).parent / "corpus"
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-004")
LEVEL_BY_FILE = {"what_is_smt.md": "smt", "trading_101.md": "trading", "crypto_101.md": "crypto"}


def chunk(text: str, size: int = 800, overlap: int = 120) -> list[str]:
    """Simple paragraph-aware sliding window — good enough for a small curated corpus."""
    paras, chunks, buf = [p.strip() for p in text.split("\n\n") if p.strip()], [], ""
    for p in paras:
        if len(buf) + len(p) + 2 <= size:
            buf = f"{buf}\n\n{p}".strip()
        else:
            if buf:
                chunks.append(buf)
            buf = (buf[-overlap:] + "\n\n" + p) if buf else p
    if buf:
        chunks.append(buf)
    return chunks


def embed(texts: list[str]) -> list[list[float]]:
    import vertexai
    from vertexai.language_models import TextEmbeddingModel
    vertexai.init(project=os.environ["GOOGLE_CLOUD_PROJECT"],
                  location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"))
    model = TextEmbeddingModel.from_pretrained(EMBED_MODEL)
    return [e.values for e in model.get_embeddings(texts)]


def main() -> None:
    import psycopg2
    rows = []
    for path in sorted(CORPUS.glob("*.md")):
        level = LEVEL_BY_FILE.get(path.name, "smt")
        for c in chunk(path.read_text()):
            rows.append((level, path.name, c))
    if not rows:
        print("no corpus files found")
        return

    vectors = embed([r[2] for r in rows])
    conn = psycopg2.connect(os.environ["ALLOYDB_CONN"])
    with conn, conn.cursor() as cur:
        cur.execute("DELETE FROM education_chunks")
        for (level, source, c), vec in zip(rows, vectors):
            cur.execute(
                "INSERT INTO education_chunks (level, source, chunk, embedding) "
                "VALUES (%s, %s, %s, %s)",
                (level, source, c, vec),
            )
    print(f"ingested {len(rows)} chunks into education_chunks")


if __name__ == "__main__":
    main()

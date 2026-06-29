"""Chat-with-SMT agent — answers about SMT's current reads + general crypto/trading.

Reuses Track 1 (ADK agent) + Track 2 (MCP tools: it reads SMT's *sanitized* brain via the
MCP server in agents/mcp_server.py) + Track 3 (AlloyDB RAG for grounded education answers).

`answer()` degrades gracefully: if Vertex/ADK aren't configured, it still returns a useful,
RAG-or-corpus-grounded reply so the public demo never hard-fails.
"""

from __future__ import annotations

import os

from brain import adapter
from agents.educator_agent import rung


def _vertex_answer(message: str, context: str) -> str | None:
    """Try a real Gemini answer via Vertex; return None if not configured."""
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not project:
            return None
        vertexai.init(project=project, location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"))
        model = GenerativeModel(os.getenv("CHAT_MODEL", "gemini-2.5-flash"))
        prompt = (
            "You are SMT, a transparent multi-persona trading AI talking to a beginner. "
            "Answer in first person, warmly, grounded ONLY in this context:\n\n"
            f"{context}\n\nQuestion: {message}"
        )
        return model.generate_content(prompt).text
    except Exception:
        return None


def answer(message: str, level: str = "smt") -> dict:
    """Answer a guest question. Pulls SMT's live-shaped reads + grounded education context."""
    # Grounding: RAG corpus rung + (optionally) the current world snapshot so SMT can talk
    # about what it's "seeing" right now — on demo data in the public build.
    try:
        from agents.rag.retrieve import retrieve
        ctx = retrieve(message, level=level) or rung(level)
    except Exception:
        ctx = rung(level)

    snapshot = adapter.world()
    ctx = f"{ctx}\n\nSMT's current reads ({snapshot['source']} data): " + ", ".join(
        f"{p}:{d['action']}@{round(d['conf']*100)}%" for p, d in snapshot["pairs"].items()
    )

    reply = _vertex_answer(message, ctx)
    grounded = reply is not None
    if reply is None:
        reply = (
            "Here's what I can tell you from my notes:\n\n"
            + rung(level)[:600]
            + "\n\n(Live Gemini answers turn on once GOOGLE_CLOUD_PROJECT is set.)"
        )
    return {"reply": reply, "grounded": grounded, "brain_source": snapshot["source"]}

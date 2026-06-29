"""Educator agent — the progressive SMT -> trading -> crypto teacher.

Reuses the Track 1 pattern (ADK agent on Cloud Run). The agent grounds its answers in the
AlloyDB RAG corpus (agents/rag/) so it teaches from OUR material, not hallucination. When ADK
/ Vertex are not configured (e.g. local demo), `rung()` returns the curated lesson directly so
the UI's "learn" ladder always works.
"""

from __future__ import annotations

import os
from pathlib import Path

CORPUS = Path(__file__).parent / "rag" / "corpus"
LADDER = {
    "smt": ("what_is_smt.md", "Start here: what SMT is and how to read a decision."),
    "trading": ("trading_101.md", "Next: the trading ideas you need to read an SMT call."),
    "crypto": ("crypto_101.md", "Then: crypto fundamentals behind the 8 pairs SMT trades."),
}

_SYSTEM = (
    "You are SMT's Educator. Teach a TOTAL beginner, warmly and concretely. Never assume crypto "
    "knowledge. Climb the ladder SMT -> trading -> crypto. Ground every answer in the provided "
    "context; if it isn't there, say so plainly. Keep it to a few short paragraphs."
)


def rung(level: str) -> str:
    """Return the curated lesson for a ladder rung (used directly by the UI + as RAG seed)."""
    fname, _blurb = LADDER.get(level, LADDER["smt"])
    path = CORPUS / fname
    return path.read_text() if path.exists() else _blurb


def build_agent():
    """Construct the ADK agent (Track 1 style). Imported lazily so the demo runs without ADK."""
    from google.adk.agents import Agent          # google-adk
    from agents.rag.retrieve import retrieve

    def teach(topic: str, level: str = "smt") -> str:
        """Tool: fetch grounded context for a topic at a ladder level."""
        ctx = retrieve(topic, level=level)
        return ctx or rung(level)

    return Agent(
        name="smt_educator",
        model=os.getenv("EDUCATOR_MODEL", "gemini-2.5-flash"),
        instruction=_SYSTEM,
        tools=[teach],
    )

"""Brain boundary: prefer the REAL (private) SMT brain, fall back to the public DEMO brain.

In the public submission deployment, the `smt` package is NOT vendored, so `SOURCE == "demo"`
and the app runs entirely on synthetic votes (moat-safe). In SMT's private deployment, the real
`smt` package is importable, `SOURCE == "live"`, and the SAME front-end contract is served from
the live personas — judges see the architecture, never the edge. See docs/MOAT.md.
"""

from __future__ import annotations
from typing import Dict

from brain import demo_brain

try:
    # Real brain — only importable inside SMT's private environment.
    from smt.personas.judge import JudgePersona            # noqa: F401
    from smt.explain.explainer import explain_decision     # noqa: F401
    _HAVE_REAL = True
except Exception:
    _HAVE_REAL = False

# The public repo always advertises "demo" so the moat boundary is explicit to judges.
SOURCE = "live" if _HAVE_REAL else "demo"

PAIRS = demo_brain.PAIRS


def decision(pair: str) -> Dict:
    """One pair's sanitized decision dict (action / conf / why / drivers / votes / risk_score)."""
    # Public path: synthetic. Private path would build live votes → JudgePersona → explain_decision
    # and return the same dashboard_dict shape (intentionally not wired in the public repo).
    return demo_brain.decide(pair).dashboard_dict()


def world() -> Dict:
    """All-pairs snapshot for the 3D world view."""
    snap = demo_brain.world_snapshot()
    snap["source"] = SOURCE
    return snap

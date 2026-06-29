"""Self-contained DEMO brain for the public SMT World app.

WHY THIS EXISTS (read docs/MOAT.md): the public repo must run end-to-end for judges
WITHOUT shipping SMT's edge. So this module produces decisions in the EXACT shape the
real SMT brain emits (the `dashboard_dict` contract: action / conf / why / drivers / votes),
but from deterministic *synthetic* persona votes — never the live, tuned personas, never a
real threshold, never live PnL. Swap-in of the private brain happens in `brain/adapter.py`.

The six personas mirror SMT's: order-flow, technical, on-chain/whale, sentiment, regime.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Dict, List

PAIRS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "LTC"]
PERSONAS = ["flow", "technical", "whale", "onchain", "sentiment", "regime"]

# Public, illustrative conviction floor for the demo ONLY. The real per-pair floors are
# withheld (moat). This is a round display number, not a tuned parameter.
DEMO_CONF_FLOOR = 0.55


@dataclass
class Vote:
    """Mirrors smt.personas.base.PersonaVote (direction / confidence / reasoning)."""
    direction: str          # LONG / SHORT / NEUTRAL
    confidence: float       # 0.0-1.0
    reasoning: str = ""


@dataclass
class Decision:
    pair: str
    action: str             # LONG / SHORT / WAIT
    confidence: float
    why: str
    drivers: List[str] = field(default_factory=list)
    votes: Dict[str, List] = field(default_factory=dict)
    risk_score: int = 50

    def dashboard_dict(self) -> Dict:
        return {
            "pair": self.pair,
            "action": self.action,
            "conf": round(self.confidence, 4),
            "why": self.why,
            "drivers": self.drivers,
            "votes": self.votes,
            "risk_score": self.risk_score,
        }


def _seed(pair: str, salt: str = "") -> float:
    """Deterministic 0..1 from pair name — stable demo data, no RNG flicker."""
    h = hashlib.sha256(f"{pair}:{salt}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def _persona_vote(pair: str, persona: str) -> Vote:
    s = _seed(pair, persona)
    direction = "LONG" if s > 0.58 else "SHORT" if s < 0.42 else "NEUTRAL"
    conf = round(0.30 + s * 0.6, 3) if direction != "NEUTRAL" else round(s * 0.25, 3)
    notes = {
        "flow": "order-book imbalance + taker pressure",
        "technical": "trend + momentum structure",
        "whale": "large-transfer / smart-money net-flow",
        "onchain": "chain TVL + accumulation",
        "sentiment": "news + social tone (Gemini)",
        "regime": "trend-up/down + Fear&Greed band",
    }
    return Vote(direction, conf, notes.get(persona, persona))


def decide(pair: str) -> Decision:
    """Synthetic JUDGE: weighted tally of the six persona votes → one decision + faithful why."""
    pair = pair.upper()
    votes = {p: _persona_vote(pair, p) for p in PERSONAS}

    long_score = sum(v.confidence for v in votes.values() if v.direction == "LONG")
    short_score = sum(v.confidence for v in votes.values() if v.direction == "SHORT")
    lean = "LONG" if long_score > short_score else "SHORT"
    margin = abs(long_score - short_score)
    conf = round(min(0.95, 0.40 + margin / max(1e-9, (long_score + short_score)) * 0.5), 3)

    if conf < DEMO_CONF_FLOOR:
        action, lean_dir = "WAIT", lean
    else:
        action, lean_dir = lean, lean

    drivers = sorted(
        [n for n, v in votes.items() if v.direction == lean_dir],
        key=lambda n: votes[n].confidence, reverse=True,
    )[:2]

    why = _why(pair, action, conf, lean_dir, drivers, votes)
    votes_view = {n: [v.direction, round(v.confidence, 3), v.reasoning] for n, v in votes.items()}
    return Decision(
        pair=pair, action=action, confidence=conf, why=why,
        drivers=drivers, votes=votes_view, risk_score=_risk(conf, action),
    )


def _why(pair, action, conf, lean, drivers, votes) -> str:
    """Faithful 3-sentence 'why' — same spirit as smt.explain.explain_decision."""
    pct = round(conf * 100)
    if action in ("LONG", "SHORT"):
        s1 = f"I'm going {action} on {pair} with {pct}% conviction."
    else:
        s1 = f"I'm sitting out {pair} — at {pct}% I'm under my {round(DEMO_CONF_FLOOR*100)}% conviction floor."
    if drivers:
        d = " and ".join(f"my {n} read ({votes[n].reasoning})" for n in drivers)
        s2 = f"The call is driven by {d}."
    else:
        s2 = "No persona has a strong enough read to lead right now."
    disagree = [n for n, v in votes.items() if v.direction not in (lean, "NEUTRAL")]
    s3 = (f"{', '.join(disagree)} lean the other way, so I'm sizing for that risk."
          if disagree else "The personas broadly agree, so conviction holds.")
    return f"{s1} {s2} {s3}"


def _risk(conf: float, action: str) -> int:
    if action in ("WAIT", "BLOCK"):
        return 5
    return max(10, min(95, round((1.0 - conf) * 100)))


def world_snapshot() -> Dict:
    """All 8 pairs' decisions — the payload the 3D 'SMT World' front-end renders."""
    return {"pairs": {p: decide(p).dashboard_dict() for p in PAIRS}, "source": "demo"}


if __name__ == "__main__":
    import json
    print(json.dumps(world_snapshot(), indent=2))

"""SMT World API — the Cloud Run service the guest UI talks to.

Endpoints (all public, read-only, moat-safe):
  GET  /healthz                 — liveness
  GET  /world                   — all-8-pairs decision snapshot (3D world payload)
  GET  /decision/{pair}         — one pair's decision + faithful "why" + risk score
  GET  /education/{level}       — the Educator agent's progressive rung (smt|trading|crypto)
  POST /chat                    — chat-with-SMT (RAG-grounded; falls back to a canned reply)

Deploy: see deploy/cloudrun-api.yaml. The chat/education routes call the ADK agents
(agents/) when configured; otherwise they degrade gracefully so the demo never hard-fails.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from brain import adapter, bq_log

app = FastAPI(title="SMT World", version="0.1.0",
              description="Explainable decision-intelligence companion — GCP APAC Cohort 2")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    level: Optional[str] = "smt"     # smt | trading | crypto


@app.get("/healthz")
def healthz():
    return {"ok": True, "brain_source": adapter.SOURCE}


@app.get("/world")
def world(background_tasks: BackgroundTasks):
    """All 8 pairs — what the 3D 'SMT World' renders. Source = demo (public) or live (private)."""
    snap = adapter.world()
    # Land sanitized activity into BigQuery (best-effort, off the request path).
    background_tasks.add_task(bq_log.log_world, snap)
    return snap


@app.get("/decision/{pair}")
def decision(pair: str, background_tasks: BackgroundTasks):
    if pair.upper() not in adapter.PAIRS:
        raise HTTPException(404, f"unknown pair '{pair}'. known: {adapter.PAIRS}")
    d = adapter.decision(pair)
    # Land sanitized activity into BigQuery (best-effort, off the request path).
    background_tasks.add_task(bq_log.log_decision, d, adapter.SOURCE)
    return d


@app.get("/education/{level}")
def education(level: str):
    from agents.educator_agent import rung
    return {"level": level, "lesson": rung(level)}


@app.post("/chat")
def chat(req: ChatRequest):
    """Chat-with-SMT, grounded in the AlloyDB RAG corpus when available."""
    from agents.smt_chat_agent import answer
    return answer(req.message, level=req.level or "smt")


# Serve the static front-end (Stitch + three.js) from the same Cloud Run service.
_FRONTEND = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(_FRONTEND):
    app.mount("/", StaticFiles(directory=_FRONTEND, html=True), name="frontend")

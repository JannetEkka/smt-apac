"""Best-effort BigQuery landing for decision activity (Track: BigQuery + Looker).

Lands each served decision into `<project>.<dataset>.decisions` (default dataset `smtworld`)
so the sanitized `public_activity` view (see looker/DASHBOARD.md) can power the public Looker
Studio embed. This is the EXACT moat-safe schema the looker doc defines — only:

    ts, pair, action, conf, risk, drivers, source

No params, no thresholds, no PnL — nothing reconstructable into alpha (see docs/MOAT.md).

Fully optional + non-blocking: if `GOOGLE_CLOUD_PROJECT` is unset, the client/lib is missing,
or the insert fails, it silently no-ops so the demo never hard-fails. Wire it behind FastAPI
`BackgroundTasks` so logging never adds latency to a request.
"""

from __future__ import annotations

import datetime as _dt
import os
from typing import Dict

DATASET = os.getenv("BQ_DATASET", "smtworld")
TABLE = os.getenv("BQ_TABLE", "decisions")

_client = None
_disabled = False


def _get_client():
    """Lazily build a BigQuery client; cache it. Returns None if unavailable/unconfigured."""
    global _client, _disabled
    if _disabled:
        return None
    if _client is not None:
        return _client
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project:
        _disabled = True
        return None
    try:
        from google.cloud import bigquery
        _client = bigquery.Client(project=project)
        return _client
    except Exception:
        _disabled = True
        return None


def log_decision(d: Dict, source: str) -> None:
    """Stream one sanitized decision row into BigQuery. Best-effort, swallows all errors."""
    client = _get_client()
    if client is None:
        return
    try:
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        table_id = f"{project}.{DATASET}.{TABLE}"
        row = {
            "ts": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "pair": d.get("pair"),
            "action": d.get("action"),
            "conf": float(d.get("conf", 0.0)),
            "risk": int(d.get("risk_score", 0)),
            "drivers": ",".join(d.get("drivers", []) or []),
            "source": source,
        }
        client.insert_rows_json(table_id, [row])
    except Exception:
        # Never let analytics logging break a guest request.
        return


def log_world(snapshot: Dict) -> None:
    """Land every pair from a world snapshot (one row per pair)."""
    source = snapshot.get("source", "demo")
    for d in snapshot.get("pairs", {}).values():
        log_decision(d, source)

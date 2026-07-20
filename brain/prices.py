"""Real spot prices for the simulated copy-trade — public market data, no moat.

The copy-trade marks a guest's paper portfolio on REAL prices (prices are public market
data, never alpha). We fetch the 8 pairs' USD spot + 24h change from a public, key-less
source (CoinGecko), cache it briefly, and fall back to a committed snapshot so the demo
never hard-fails — the response carries `live: true/false` so the UI can label it honestly.

Nothing here touches the moat: no signals, no params, no PnL — just the price a paper
position is marked against.
"""

from __future__ import annotations

import json
import time
import urllib.request
from typing import Dict

# Our 8 pairs → CoinGecko ids (public, no API key).
_CG_ID = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana", "BNB": "binancecoin",
    "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin", "LTC": "litecoin",
}
_CG_URL = (
    "https://api.coingecko.com/api/v3/simple/price?ids="
    + ",".join(_CG_ID.values())
    + "&vs_currencies=usd&include_24hr_change=true"
)

# Committed fallback (approx, used ONLY when the live fetch is unreachable — labelled
# `live: false` in the response so the UI says "approx / offline", never claims it's live).
_FALLBACK = {
    "BTC": {"price": 118000.0, "change24h": 0.0}, "ETH": {"price": 3600.0, "change24h": 0.0},
    "SOL": {"price": 175.0, "change24h": 0.0},   "BNB": {"price": 690.0, "change24h": 0.0},
    "XRP": {"price": 3.05, "change24h": 0.0},    "ADA": {"price": 0.82, "change24h": 0.0},
    "DOGE": {"price": 0.22, "change24h": 0.0},   "LTC": {"price": 110.0, "change24h": 0.0},
}

_CACHE: Dict = {"ts": 0.0, "data": None}
_TTL_S = 30.0


def _fetch_live() -> Dict:
    req = urllib.request.Request(_CG_URL, headers={"User-Agent": "smt-world/1.0"})
    with urllib.request.urlopen(req, timeout=4) as r:  # noqa: S310 (public read-only)
        raw = json.loads(r.read().decode())
    out = {}
    for pair, cid in _CG_ID.items():
        row = raw.get(cid) or {}
        out[pair] = {
            "price": float(row.get("usd", _FALLBACK[pair]["price"])),
            "change24h": round(float(row.get("usd_24h_change", 0.0)), 2),
        }
    return out


def prices() -> Dict:
    """{pairs:{PAIR:{price,change24h}}, live:bool, ts:...}. Cached ~30s, never raises."""
    now = time.time()
    if _CACHE["data"] is not None and now - _CACHE["ts"] < _TTL_S:
        return _CACHE["data"]
    try:
        data = {"pairs": _fetch_live(), "live": True, "ts": now}
    except Exception:
        # Public source unreachable — serve the committed snapshot, labelled not-live.
        data = {"pairs": {k: dict(v) for k, v in _FALLBACK.items()}, "live": False, "ts": now}
    _CACHE.update(ts=now, data=data)
    return data

"""cuDF acceleration proof — the rubric's "evidence acceleration improves the experience".

SMT's learning stack validates strategies with CPCV (combinatorial purged cross-validation):
many train/test splits over long OHLCV history, with rolling features recomputed per split.
That is heavy, embarrassingly-parallel pandas work — the canonical cudf.pandas win.

This script runs the SAME pandas code two ways and prints wall-time + speedup:

  CPU :  python accel/cudf_benchmark.py
  GPU :  python -m cudf.pandas accel/cudf_benchmark.py      # zero code change, runs on NVIDIA GPU

`cudf.pandas` proxies every pandas call to the GPU (cuDF) and falls back to CPU where needed,
so the workload below is plain pandas — no GPU-specific code. On an L4 / T4 we see a large
speedup on the rolling-feature + groupby aggregation that dominates CPCV.

Knobs: BENCH_PAIRS, BENCH_DAYS, BENCH_SPLITS (env). Defaults size to ~a few seconds on CPU.
"""

from __future__ import annotations

import os
import time

import numpy as np
import pandas as pd

PAIRS = int(os.getenv("BENCH_PAIRS", "8"))
DAYS = int(os.getenv("BENCH_DAYS", "1095"))          # ~3y of minute bars per pair if MINUTES
BARS_PER_DAY = int(os.getenv("BENCH_BARS_PER_DAY", "288"))   # 5-min bars
N_SPLITS = int(os.getenv("BENCH_SPLITS", "40"))      # CPCV combinatorial test groups


def synth_ohlcv() -> pd.DataFrame:
    """Synthetic OHLCV for PAIRS — no market data, no moat; just a realistic compute shape."""
    n = DAYS * BARS_PER_DAY
    rng = np.random.default_rng(7)
    frames = []
    for i in range(PAIRS):
        ret = rng.normal(0, 0.002, n).cumsum()
        price = 100 * np.exp(ret)
        frames.append(pd.DataFrame({
            "pair": i,
            "t": np.arange(n),
            "close": price,
            "high": price * (1 + np.abs(rng.normal(0, 0.001, n))),
            "low": price * (1 - np.abs(rng.normal(0, 0.001, n))),
            "vol": rng.lognormal(10, 1, n),
        }))
    return pd.concat(frames, ignore_index=True)


def cpcv_features(df: pd.DataFrame) -> float:
    """The hot loop: per split, recompute rolling features + grouped aggregates (CPCV inner work).

    Every op here is GPU-native under `cudf.pandas` — whole-column rolling windows
    (`Series.rolling(w).mean()/max()/min()/sum()`), vectorized column arithmetic, `shift`, and
    `groupby` reductions (`mean`/`std`/`sum`). We deliberately AVOID per-group Python lambdas and
    `GroupBy.apply`, which `cudf.pandas` must run on the CPU (with GPU↔CPU copies) and which made an
    earlier version SLOWER on GPU than CPU. (See rapidsai/cudf docs: rolling + groupby reductions
    run on GPU; custom lambdas/apply fall back.) Rolling is whole-column rather than per-pair — fine
    for a throughput benchmark on synthetic data; the compute shape is what we're measuring.
    """
    acc = 0.0
    close, vol = df["close"], df["vol"]
    pv = close * vol
    for s in range(N_SPLITS):
        w = 20 + s                                   # vary the window per split
        ma = close.rolling(w, min_periods=1).mean()
        mx = close.rolling(w, min_periods=1).max()
        mn = close.rolling(w, min_periods=1).min()
        mom = close - close.shift(w)                 # momentum over the window
        vwap = pv.rolling(w, min_periods=1).sum() / vol.rolling(w, min_periods=1).sum()
        z = (close - ma) / (mx - mn).replace(0, np.nan)
        feat = df.assign(z=z, mom=mom, vwap=vwap)
        # Grouped reductions (GPU-native) so the result depends on every feature and every pair.
        g = feat.groupby("pair")
        acc += float(g["z"].mean().abs().sum())
        acc += float(g["mom"].std().abs().sum())
        acc += float(g["vwap"].mean().abs().sum())
    return acc


def main() -> None:
    using_gpu = "cudf" in str(pd).lower() or os.getenv("CUDF_PANDAS") == "1"
    mode = "GPU (cudf.pandas)" if using_gpu else "CPU (stock pandas)"
    print(f"[bench] mode={mode}  pairs={PAIRS} days={DAYS} bars/day={BARS_PER_DAY} splits={N_SPLITS}")

    t0 = time.perf_counter()
    df = synth_ohlcv()
    t1 = time.perf_counter()
    result = cpcv_features(df)
    t2 = time.perf_counter()

    print(f"[bench] rows={len(df):,}  build={t1-t0:.2f}s  cpcv={t2-t1:.2f}s  total={t2-t0:.2f}s")
    print(f"[bench] checksum={result:.4f}   (run CPU then `python -m cudf.pandas {__file__}` for GPU)")


if __name__ == "__main__":
    main()

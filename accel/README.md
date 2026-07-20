# accel/ — the NVIDIA acceleration proof

Challenge 2 scores **"evidence that acceleration improves the experience."** Ours is concrete and
**measured on the real lake**, not just a microbenchmark.

## The real number (measured, T4, 2026-07-14)
On SMT's actual data — **446,976** 5-minute kline rows + **163,554** archived decisions (8 pairs) —
training the forward `P(up|4h)` model on an NVIDIA GPU:

| Leg | CPU | CUDA | Speedup |
|---|---|---|---|
| XGBoost `P(up\|4h)` train (400 trees) | 3.48s | 1.63s | **2.1×** |
| XGBoost inference | 0.91s | 0.14s | **6.5×** |

Identical model output on both devices — the GPU changes the *speed*, not the answer. At today's
corpus the **feature-engineering leg is already sub-second on CPU (0.51s / 447K rows)**, so we don't
pretend a `cudf.pandas` win we didn't need yet. The win **compounds with scale**: 1m klines (12×
rows), per-pair model sweeps (8×), rolling CPCV (dozens of refits).

## The scale projection (`cudf_benchmark.py`)
SMT validates strategies with **CPCV** (combinatorial purged cross-validation) — many train/test
splits over long OHLCV history, each recomputing rolling features: heavy, repetitive pandas, the
textbook `cudf.pandas` win *at scale*. This script is a **projection** of that compounding on
synthetic data — honest about being synthetic, so nobody mistakes it for the measured result above.

## Run it

```bash
# CPU baseline (stock pandas)
python accel/cudf_benchmark.py

# GPU — zero code change: cudf.pandas proxies every pandas call to an NVIDIA GPU (cuDF)
python -m cudf.pandas accel/cudf_benchmark.py
```

Same code, two runs. Print shows `build` + `cpcv` wall-times; the ratio is the speedup. Run this
in a **RAPIDS** environment (Vertex AI Workbench GPU instance, or Colab GPU) — see
`../deploy/vertex_gpu_notebook.md`.

## Make the gap dramatic
```bash
BENCH_DAYS=3650 BENCH_SPLITS=80 python accel/cudf_benchmark.py            # CPU (slow)
BENCH_DAYS=3650 BENCH_SPLITS=80 python -m cudf.pandas accel/cudf_benchmark.py   # GPU (fast)
```

## What it means for the product
Faster validation = SMT can **refit and re-validate more often**, so its decisions reflect newer
market regimes with lower time-to-insight. That's the user-facing payoff, not just a benchmark.

> The benchmark uses **synthetic** OHLCV — the compute shape is SMT's real CPCV, the alpha is never
> shown. Moat stays private (see `../docs/MOAT.md`).

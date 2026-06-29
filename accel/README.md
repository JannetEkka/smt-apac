# accel/ — the NVIDIA acceleration proof

Challenge 2 scores **"evidence that acceleration improves the experience."** Ours is concrete:
SMT validates strategies with **CPCV** (combinatorial purged cross-validation) — many train/test
splits over long OHLCV history, each recomputing rolling features. That's heavy, repetitive pandas
work: the textbook `cudf.pandas` win.

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

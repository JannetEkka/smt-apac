# Vertex AI / Colab GPU notebook — the acceleration run

The **measured** acceleration numbers in the submission (XGBoost `P(up|4h)` **CPU 3.48s → CUDA
1.63s = 2.1×** train, **6.5×** inference, on 446,976 real kline rows + 163,554 decisions) come from
a **T4 run on SMT's real lake**. This repo ships `accel/cudf_benchmark.py` as the reproducible,
public **scale projection** of the same compute on synthetic data — run it on any GPU to see the
`cudf.pandas` win at large scale.

## Fastest path (RAPIDS image)
1. Vertex AI → Workbench → **new instance** with a GPU (T4 or L4) and the **RAPIDS** image
   (RAPIDS ships `cudf`, `cuml`, `cudf.pandas`). 24 GB L4 is plenty.
2. Upload the repo (or `git clone`), then in a terminal:

   ```bash
   # CPU baseline
   python accel/cudf_benchmark.py
   # GPU — zero code change
   python -m cudf.pandas accel/cudf_benchmark.py
   ```

3. Record both wall-times → that ratio is the slide. Scale up with
   `BENCH_DAYS=3650 BENCH_SPLITS=80` to make the gap dramatic.

## Why this is honest
The benchmark runs SMT's real validation *shape* (CPCV: rolling features + grouped aggregates over
long OHLCV history) on **synthetic** prices — the compute is real, the alpha is not shown.

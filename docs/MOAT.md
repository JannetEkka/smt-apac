# What's withheld, and why (read me, judges)

SMT World is **fully open and runnable** — but a thin, deliberate slice stays private. We want to be
upfront about exactly what and why, because transparency is the whole point of SMT.

## What you CAN see (this repo, the live demo)
- The **architecture**: six specialist personas → a **JUDGE** → a faithful, three-sentence
  explanation, plus a forward **P(up) probability forecaster** that the JUDGE consults.
- The **decision contract**: `action / conviction / risk / drivers / why / per-persona votes`.
- The **education layer** (SMT → trading → crypto), the **chat**, the **3D world**, the
  **user journey** (guest → onboard → watch live decisions → exchange/wallet login + SMT's shadow account), the
  **acceleration benchmark**, and every line of GCP/NVIDIA deployment code.
- The app runs end-to-end on **synthetic** persona votes (`brain/demo_brain.py`) in the **exact
  shape** the live brain emits.

## What's WITHHELD (and why)
| Withheld | Why |
|---|---|
| Signal-generation parameters (learned params) | This is the literal edge; publishing it removes it. |
| Per-pair research (ground-truth charts) | Hand-built ground truth — the moat, not the architecture. |
| Calibrated thresholds / HARD-BLOCK cells | Reconstructs the strategy if exposed. |
| Live per-pair decisions + PnL | Competitive, and reserved for a continuous public track record we publish deliberately (patent-pending). Not needed to judge the *tool*. |

## How the boundary is enforced in code
`brain/adapter.py` advertises `SOURCE = "demo"` and serves synthetic votes. The MCP server
(`agents/mcp_server.py`) only ever returns sanitized decisions / explanations / education — there is
no tool that exposes a parameter, a threshold, or PnL. In SMT's private deployment the same adapter
flips to `SOURCE = "live"` **behind authentication**, serving the identical contract from the real
personas. The public guest sees the architecture and the explainability on real prices; the real
per-pair calls and PnL sit behind the operator's admin login. **Judges see the architecture and the
explainability; never the edge.**

This is standard practice and, we'd argue, the honest version of it: the multi-agent + judge pattern
is well-known and *should* be open. The earned advantage — the tuned numbers and the research — is
what stays ours.

## A note on the acceleration numbers (honesty)
The headline GPU figures come from our **real lake**, not a synthetic microbenchmark: XGBoost
`P(up|4h)` on 446,976 kline rows + 163,554 archived decisions, **CPU 3.48s → CUDA 1.63s (2.1×)**
train, **6.5×** inference, identical model output (the GPU changes the *speed*, not the answer). At
today's corpus the feature-engineering leg is already sub-second on CPU, so we say so rather than
overclaim a `cudf.pandas` win we didn't need yet — the GPU story compounds with scale (see
`accel/README.md`). The synthetic `accel/cudf_benchmark.py` is kept only as a **scale projection**,
clearly labelled.

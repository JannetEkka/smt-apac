# What's withheld, and why (read me, judges)

SMT World is **fully open and runnable** — but a thin, deliberate slice stays private. We want to be
upfront about exactly what and why, because transparency is the whole point of SMT.

## What you CAN see (this repo, the live demo)
- The **architecture**: six personas → a JUDGE → a faithful, three-sentence explanation.
- The **decision contract**: `action / conviction / risk / drivers / why / per-persona votes`.
- The **education layer** (SMT → trading → crypto), the **chat**, the **3D world**, the
  **acceleration benchmark**, and every line of GCP/NVIDIA deployment code.
- The app runs end-to-end on **synthetic** persona votes (`brain/demo_brain.py`) in the **exact
  shape** the live brain emits.

## What's WITHHELD (and why)
| Withheld | Why |
|---|---|
| Signal-generation parameters (`v4/` learned params) | This is the literal edge; publishing it removes it. |
| Per-pair research (`docs/research/`) | Hand-built ground truth — the moat, not the architecture. |
| Calibrated thresholds / HARD-BLOCK cells | Reconstructs the strategy if exposed. |
| Live PnL / WEEX-verified equity | Competitive + not needed to judge the *tool*. |

## How the boundary is enforced in code
`brain/adapter.py` advertises `SOURCE = "demo"` and serves synthetic votes. The MCP server
(`agents/mcp_server.py`) only ever returns sanitized decisions/explanations/education — there is no
tool that exposes a parameter, a threshold, or PnL. In SMT's private deployment the same adapter
flips to `SOURCE = "live"` behind authentication, serving the identical contract from the real
personas. **Judges see the architecture and the explainability; never the edge.**

This is standard practice and, we'd argue, the honest version of it: the multi-agent + judge + RL
pattern is well-known and *should* be open. The earned advantage — the tuned numbers and the
research — is what stays ours.

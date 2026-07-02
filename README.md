# SMT World — see the *why*

> An explainable **decision-intelligence companion** that turns noisy crypto markets into a
> plain-language, trustworthy decision — and teaches a total beginner *why*.

**▶ APAC submission (Cloud Run):** **https://smt-world-2gbcoyhuea-uc.a.run.app**
— the deployed app judges evaluate: the 3D "brain", clickable per-pair decisions, the learn ladder, and chat.

**▶ Flagship UI (the full "ocean" experience):** **https://smt-weex-trading-bot.jannet-ekka.workers.dev**
— 8 coins as islands whose look *is* the live call, the 6 personas read per island, the **JUDGE** as the
central lighthouse, plus a zero-knowledge tutorial. Same explainable brain, richer interface.

Most market tools are black boxes: a signal, no reasoning, no way to learn or trust. **SMT World**
is the opposite. Six specialist AI personas — order-flow, technical, on-chain/whale, sentiment,
market-regime — feed a **JUDGE** that issues one call (LONG / SHORT / WAIT) with a **faithful,
three-sentence explanation**, a risk score, and every persona's vote.

## What this is (and isn't)
SMT is a **personal project I've built over the past year** — it began as a whale-behaviour
classification model on Colab + BigQuery and grew into a multi-persona, agentic decision engine.
For this hackathon it's **rebuilt as a public slice**: the moat (tuned signal params, per-pair
research, calibrated thresholds, live PnL) is **removed** and **demo data** shown in its place, so
what you see is the *explainability + education* surface — the architecture, open and honest; the
alpha, private ([`docs/MOAT.md`](docs/MOAT.md)). The north star: **Understand → Ask → Act** — a
novice gets a decision *with the why* and a ladder that teaches, asks the data in plain English
(BigQuery), and can opt into a simulated copy-trade with a path to their preferred exchange, each
persona exposed as a composable **MCP** tool.

## The decision, made legible
- **Action** — LONG / SHORT / WAIT (WAIT is a feature: no forced trades).
- **Conviction %** + a beginner **risk score**.
- **Drivers** — which personas actually led the call (faithful, not post-hoc).
- **The why** — plain English, with what the dissenters thought.

## Built on (GCP + NVIDIA)
| Layer | Tech |
|---|---|
| Agents (educator + chat-with-SMT) | **Vertex AI / Gemini + ADK** on **Cloud Run** |
| Sanitized brain as agent tools | **MCP server** + **BigQuery** |
| Ask-your-data in plain English | **BigQuery Conversational Analytics** (Gemini data agent) |
| Acceleration proof | **NVIDIA cuDF** (zero-code-change GPU) — CPU 24.0s → GPU 3.9s (~6×) |
| 3D / ocean guest UI | **Stitch** (HTML/Tailwind) + **three.js** |

Chat + education run on a curated corpus + Gemini. (An AlloyDB pgvector RAG path is included in
`agents/rag/` as a ready option but **disabled for cost** — Conversational Analytics covers the
"ask the data" job cheaper.)

**Why acceleration matters (the scored rubric line):** SMT validates strategies with CPCV
(combinatorial purged cross-validation) — heavy, repetitive pandas over long history. `accel/` runs
the *same* code on CPU and on an NVIDIA GPU via `cudf.pandas` (zero code change): **2.52M rows,
24.0s → 3.9s, identical result.** Faster validation → fresher decisions, lower time-to-insight.

## Map
```
brain/      demo brain (synthetic) + live-brain adapter (the moat boundary)
api/        FastAPI service (Cloud Run) — /world /decision /education /chat + static UI
agents/     ADK educator + chat agents · MCP server · rag/ (corpus; AlloyDB path optional)
accel/      cuDF CPCV benchmark — the acceleration proof
frontend/   Stitch HTML/Tailwind + three.js "SMT World"
notebooks/  sanitized BigQuery activity analysis (charts + AI_FORECAST)
deploy/     Cloud Build · Cloud Run · Vertex GPU notebook
docs/       ARCHITECTURE · MOAT
```

# SMT World — see the *why*

> An explainable **decision-intelligence companion** that turns noisy crypto markets into a
> plain-language, trustworthy decision — and teaches a total beginner *why*.
>
> Built for the **Google Gen AI Academy APAC — Cohort 2 hackathon (Challenge 2: a data
> intelligence tool people would actually use, accelerated).**

Most market tools are black boxes: a signal, no reasoning, no way to learn or trust. **SMT World**
is the opposite. Six specialist AI personas — order-flow, technical, on-chain/whale, sentiment,
market-regime — feed a **JUDGE** that issues one call (LONG / SHORT / WAIT) with a **faithful,
three-sentence explanation**, a risk score, and every persona's vote. A non-crypto user lands,
learns (SMT → trading → crypto), explores SMT's "brain" in 3D, chats with SMT, and can join a
**simulated copy-trade** (launch partner: **WEEX**).

## The bigger picture (what this glimpse is part of)
SMT World is the **public, explainability-and-education surface** of a larger system the team has
been building for over a year — it began as a whale-behaviour classification model on Colab +
BigQuery and grew into a multi-persona, agentic decision engine. For this hackathon we deliberately
show a **slice on synthetic data**: the reasoning, the 3D brain, the education, the conversational
analytics — while the **alpha (signal params, per-pair research, calibrated thresholds, live PnL)
stays private**. The north star, in three steps:
1. **Understand** — anyone, crypto-novice included, gets a trustworthy decision *with the why*, and
   a ladder that teaches them the concepts as they go.
2. **Ask** — natural-language conversational analytics over what SMT is seeing (BigQuery), so users
   interrogate the data, not just consume a number.
3. **Act** — opt-in **simulated copy-trade today**, with a path to real execution on the user's
   **preferred exchange** (WEEX launch partner) — each persona exposed as a composable **MCP** tool
   so the brain plugs into other agents and surfaces. Goal: take someone from *"I don't get crypto"*
   to *acting on an explained, risk-scored decision* as fast and as safely as possible.

> **Analysis notebook:** [`notebooks/smt_world_activity_analysis.ipynb`](notebooks/smt_world_activity_analysis.ipynb)
> charts the sanitized BigQuery activity (action mix, conviction over time, an `AI_FORECAST`) — runs
> in BigQuery Studio or Colab. Aggregates only; the alpha stays private.

## The decision, made legible
- **Action** — LONG / SHORT / WAIT (and WAIT is a feature: no forced trades).
- **Conviction %** + a beginner **risk score**.
- **Drivers** — which personas actually led the call (faithful, not post-hoc).
- **The why** — plain English, with what the dissenters thought.

## What it's built on (GCP + NVIDIA — ~5 of the required stack)
| Layer | Tech | Academy track reused |
|---|---|---|
| Agents (educator + chat-with-SMT) | **Vertex AI / Gemini + ADK** on **Cloud Run** | Track 1 |
| Sanitized brain as agent tools | **MCP server** + **BigQuery** | Track 2 |
| Ask-your-data in plain English | **BigQuery Conversational Analytics** (Gemini data agent) | Cohort 2 |
| "What SMT is seeing" panels | **BigQuery + Looker Studio** | Cohort 2 |
| Acceleration proof | **NVIDIA cuDF (zero-code-change GPU)** + **Cloud Run L4 / Vertex GPU** | — |
| 3D guest UI | **Stitch** (HTML/Tailwind) + **three.js** on Cloud Run | — |

**Why acceleration matters here (the scored rubric line):** SMT validates strategies with CPCV
(combinatorial purged cross-validation) — heavy, repetitive pandas over long history. `accel/`
runs the *same* code on CPU and on an NVIDIA GPU via `cudf.pandas` (zero code change) and reports
the speedup. Faster validation → SMT refits more often → fresher decisions, lower time-to-insight.

## Run it locally (no GCP creds needed — runs on synthetic data)
```bash
pip install fastapi "uvicorn[standard]" pydantic
uvicorn api.main:app --reload --port 8080
# open http://localhost:8080  → the 3D world + chat + ladder, all live on the demo brain
```

Turn on the real GCP pieces by setting `.env` (see `.env.example`): `GOOGLE_CLOUD_PROJECT`
flips chat to live Gemini; `ALLOYDB_CONN` flips education to RAG.

## Deploy to Cloud Run
```bash
gcloud builds submit --config deploy/cloudbuild.yaml --substitutions=_REGION=us-central1
```
Optional NVIDIA L4 GPU service: `deploy/cloudrun-gpu.yaml`. cuDF benchmark on a GPU:
`deploy/vertex_gpu_notebook.md`.

## Honest by design — what's withheld
The app is fully open and runnable on **synthetic** persona votes in the *exact* shape the live
brain emits. SMT's earned edge — tuned signal params, per-pair research, calibrated thresholds,
live PnL — stays private. The architecture and explainability are open; the alpha is not. Full
explanation: [`docs/MOAT.md`](docs/MOAT.md).

## Map
```
brain/      demo brain (synthetic) + live-brain adapter (the moat boundary)
api/        FastAPI service (Cloud Run) — /world /decision /education /chat + static UI
agents/     ADK educator + chat agents · MCP server · rag/ (AlloyDB ingest+retrieve+corpus)
accel/      cuDF CPCV benchmark — the acceleration proof
frontend/   Stitch HTML/Tailwind + three.js "SMT World"
deploy/     Cloud Build · Cloud Run (CPU + L4 GPU) · Vertex GPU notebook
looker/     BigQuery sanitized view + Looker Studio embed
docs/       ARCHITECTURE · MOAT · SUBMISSION
```

*Demo · deck · video links live in [`docs/SUBMISSION.md`](docs/SUBMISSION.md).*

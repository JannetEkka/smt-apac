# SMT World — see the *why*

> An explainable **decision-intelligence companion** that turns noisy crypto markets into a
> plain-language, trustworthy decision — and teaches a total beginner *why*.

> **Patent pending.** The flip-tested explanation method, the math-decides architecture, and the
> outcome-gated self-retuning loop are covered by a provisional patent application filed in India,
> July 2026.

**▶ Live app (Cloud Run):** **https://smt-world-2gbcoyhuea-uc.a.run.app**
— the 3D "brain", clickable per-pair decisions, the learn ladder, and chat.

**▶ Flagship UI (the full "ocean" experience):** **https://smt-weex-trading-bot.jannet-ekka.workers.dev**
— 8 coins as islands whose look *is* the live call, the 6 personas read per island, the **JUDGE** as the
central lighthouse, plus a zero-knowledge tutorial. Same explainable brain, richer interface.

Most market tools are black boxes: a signal, no reasoning, no way to learn or trust. **SMT World**
is the opposite. Six specialist AI personas — order-flow, technical, whale, on-chain, sentiment,
market-regime — feed a **JUDGE** that issues one call (LONG / SHORT / WAIT) with a **faithful,
three-sentence explanation**, a risk score, and every persona's vote.

## What this is (and isn't)
SMT is a **personal project I've built over the past year** — it began as a whale-behaviour
classification model on Colab + BigQuery and grew into a multi-persona, agentic decision engine.
It is published here as a **public slice**: the moat (tuned signal params, per-pair
research, calibrated thresholds, live PnL) is **removed** and **demo data** shown in its place, so
what you see is the *explainability + education* surface — the architecture, open and honest; the
alpha, private ([`docs/MOAT.md`](docs/MOAT.md)). The north star: **Understand → Ask → Act** — a
novice gets a decision *with the why* and a ladder that teaches, asks the data in plain English
(BigQuery), and can follow SMT's live (shadow) book with a path to their preferred exchange, each
persona exposed as a composable **MCP** tool.

## The decision, made legible
- **Action** — LONG / SHORT / WAIT (WAIT is a feature: no forced trades).
- **Conviction %** + a beginner **risk score**.
- **Drivers** — which personas actually led the call (faithful, not post-hoc).
- **The why** — plain English, with what the dissenters thought.

## The user journey (what a beginner actually does)
**Guest → onboard → watch live decisions → follow along.** A first-time visitor is met at the door
("new to crypto? to trading? or skip ahead"), learns from an AI tutor, and watches SMT's calls in the
ocean world — each island's look *is* the call. To trade alongside SMT you **log in with your exchange
or wallet** (WEEX — on a waitlist while the integration lands). The **admin** view opens SMT's own
account, running in **shadow mode** (no real orders): its live book + balance, marked on **real
prices**, clearly labelled — so you see exactly what SMT is doing. The full interactive trading flow
(pick your pairs, size, margin/leverage, per-tier fees) is the next build. The moat boundary is the
auth line — see [`docs/MOAT.md`](docs/MOAT.md).

## Under the hood (current, moat-safe)
Beyond the six-persona JUDGE, the live brain runs a forward **`P(up|4h)` probability forecaster**
(gated on out-of-sample robustness — CPCV + a deflated-Sharpe test — so only models that survive a
purged forward test ship), **quorum-renormalized** JUDGE conviction (a dead feed can't strand the
call), and a **range-fade** behaviour inside held bands. Architecture is open; the tuned numbers are
not.

## Built on (GCP + NVIDIA)
| Layer | Tech |
|---|---|
| Agents (educator + chat-with-SMT) | **Vertex AI / Gemini + ADK** on **Cloud Run** |
| Sanitized brain as agent tools | **MCP server** + **BigQuery** |
| Ask-your-data in plain English | **BigQuery Conversational Analytics** (Gemini data agent) |
| Acceleration proof | **NVIDIA GPU** on the real lake — XGBoost `P(up\|4h)` **CPU 3.48s → CUDA 1.63s (2.1×)** train, **6.5×** inference (measured, T4) |
| 3D / ocean guest UI | **Stitch** (HTML/Tailwind) + **three.js** |

Chat + education run on a curated corpus + Gemini. (An AlloyDB pgvector RAG path is included in
`agents/rag/` as a ready option but **disabled for cost** — Conversational Analytics covers the
"ask the data" job cheaper.)

**Why acceleration matters:** SMT re-learns from its own outcomes — it
trains a forward `P(up|4h)` model and validates with CPCV (combinatorial purged cross-validation)
over long history. Measured on the **real lake** (446,976 kline rows + 163,554 archived decisions,
8 pairs), XGBoost `P(up|4h)` runs **CPU 3.48s → CUDA 1.63s (2.1×)** train and **6.5×** inference on
a free-Colab **T4**, with **identical model output** — the GPU changes the *speed*, not the answer.
At today's corpus the feature-engineering leg is already sub-second on CPU, so we say so rather than
overclaim; the win compounds with scale (1m klines = 12× rows, per-pair sweeps = 8×, rolling CPCV =
dozens of refits). `accel/cudf_benchmark.py` is kept as an honest **scale projection** of that
compounding. Faster re-learning → fresher decisions, lower time-to-insight.

## Run it

Python 3.10+. No Google Cloud account, credentials or API key needed for the local demo —
the public repo ships the synthetic brain, so it runs offline end to end.

```bash
git clone https://github.com/JannetEkka/smt-apac.git
cd smt-apac
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make run                     # or: uvicorn api.main:app --reload --port 8080
```

Open <http://localhost:8080> for the ocean UI. Check it came up:

```bash
curl localhost:8080/healthz          # {"ok":true,"brain_source":"demo"}
curl localhost:8080/decision/BTC     # action, conviction, all six votes, the faithful "why"
```

`brain_source` is the moat boundary: `demo` means synthetic votes, which is what this repo
always serves. See [`docs/MOAT.md`](docs/MOAT.md).

**Lighter install.** The API only needs three packages — the rest of `requirements.txt` is
for the Cloud Run deployment (Vertex/ADK/MCP/BigQuery) and the GPU benchmark:

```bash
pip install fastapi "uvicorn[standard]" pydantic
```

**Endpoints.** `GET /healthz` · `GET /world` · `GET /decision/{pair}` ·
`GET /education/{level}` (`smt|trading|crypto`) · `POST /chat`

Chat and education call Gemini on Vertex AI when configured, and fall back to the curated
corpus when not, so both work with no credentials. To wire the real models, copy
`.env.example` to `.env` and set your project.

**Deploy to Cloud Run.**

```bash
make deploy                  # gcloud builds submit --config deploy/cloudbuild.yaml
```

**GPU benchmark** (needs a RAPIDS/GPU environment — see [`accel/README.md`](accel/README.md)):

```bash
make bench                   # CPU baseline
make bench-gpu               # NVIDIA GPU, zero code change
```

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

## Licence

Apache 2.0 — see [`LICENSE`](LICENSE).

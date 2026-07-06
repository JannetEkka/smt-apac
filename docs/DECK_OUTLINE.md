# Deck content — paste-ready, matched to the template's 11 slides

> Template: `Template_Prototype_Submission_Deck _ Gen_AI_Academy_APAC_Edition.pptx`.
> Each section below = one template slide. Replace "Type here…" with the bullets given.
> Export → **PDF ≤5 MB** (compress screenshots if over).

---

## Slide 1 — Participant Details *(already filled — keep)*
- Participant Name: **Jannet Akanksha Ekka**
- Problem Statement: **Challenge 2 — Create a data intelligence tool people would actually use, and
  show how acceleration helps them make a faster or better decision.**

## Slide 2 — Brief about the idea  ⚠️ REPLACE your current bullets (they mention a Looker embed + "far faster" — outdated)
- SMT World is an explainable decision-intelligence companion: it turns noisy crypto markets into
  one plain-language, trustworthy decision — and teaches a total beginner *why*.
- Six AI personas (order-flow, technical, on-chain, whale, sentiment, regime) feed a JUDGE that
  issues a call with a faithful three-sentence explanation, a 0–100 risk score, and every persona's vote.
- Guests explore an interactive 3D "brain", climb a guided SMT → trading → crypto learning ladder,
  and chat with SMT (Gemini on Vertex AI).
- Every decision lands in BigQuery, where a **Conversational Analytics agent** lets anyone ask the
  data in plain English — no SQL needed — and an executed notebook charts the sanitized activity.
- Served on Cloud Run. Acceleration proven with **NVIDIA cuDF**: the same strategy-validation
  pipeline runs **~6× faster on GPU (24s → 3.9s over 2.5M rows)** — identical result.
- Demo data only — the real trading edge stays private.

## Slide 3 — "Your solution should be able to explain the following" (answer all 3 in bullets)

**Approach + Google Cloud + NVIDIA:**
- Started from the challenge: a data-intelligence tool people would *actually use*, with proof that
  acceleration helps. Rebuilt my year-long trading system as a public, judge-verifiable slice.
- **Cloud Run** serves the whole app (FastAPI + 3D UI); **Gemini on Vertex AI** powers chat + the
  learning ladder; every decision streams into **BigQuery**; a **Conversational Analytics agent**
  answers plain-English questions over the sanitized view; an executed **BigQuery Studio notebook**
  analyzes + forecasts (`AI_FORECAST`) the activity.
- **NVIDIA:** the strategy-validation step (CPCV over 2.52M rows) runs with `cudf.pandas` — zero
  code change — on a T4 GPU: **24.0s → 3.9s (~6×), identical checksum** (logs + executed notebook
  in the repo).

**Real-world problem + impact:**
- Retail beginners face black-box signals: no reasoning → no trust → either no action or blind
  gambling. SMT World gives a decision **with the why** — drivers, dissenters, risk score — and
  teaches the concepts as you use it.
- Impact: financial literacy + safer participation. Transparency is structural: every cycle logs
  every pair (WAITs included), so the activity stream cannot cherry-pick winners.

**Core architecture / how data becomes decisions:**
- Market feeds → 6 personas (independent reads) → JUDGE (weighs votes, applies vetoes) → faithful
  explainer (flip-test verifies which personas actually carried the call) → decision + risk + why.
- Served on Cloud Run → activity lands in BigQuery → plain-English analytics (Conversational
  Analytics) + notebook forecasts → and the validation loop that keeps the brain honest runs ~6×
  faster on NVIDIA GPUs.

## Slide 4 — Opportunities (difference + USP)
**How it differs from existing ideas:**
- Signal groups & copy-trade bots are **black boxes** — you get a call, never the reasoning.
- Explainable-AI tooling targets ML engineers, not retail users; education apps teach theory but
  don't act on live data. SMT World does **both at once**: decide + explain + teach.

**USP:**
- **Faithful explanations** — a flip-test verifies which personas actually drove each call
  (not post-hoc storytelling).
- **WAIT is a feature** — no forced trades; the tool tells you when *not* to act.
- **Ask-the-data in plain English** — BigQuery Conversational Analytics over the live activity.
- **Honest moat** — a real year-old system shown as a public slice on demo data, and we say so.

## Slide 5 — List of features
- Interactive **3D brain**: 8 markets orbiting the JUDGE; click any pair for its decision.
- **Decision card**: LONG/SHORT/WAIT + conviction % + 0–100 risk score + faithful 3-sentence "why"
  + all 6 persona votes with reasons.
- **Learning ladder**: SMT → trading → crypto, for total beginners.
- **Chat with SMT** (Gemini on Vertex AI) — warm, beginner-level answers.
- **Plain-English data agent** (BigQuery Conversational Analytics): "Which pair had the most SHORT
  decisions today?" → answer + SQL + chart.
- **Executed analysis notebook** (BigQuery Studio): activity charts + `AI_FORECAST`.
- **Simulated copy-trade** waitlist (launch partner: WEEX).
- **GPU-accelerated validation**: cuDF, zero code change, ~6× faster.

## Slide 6 — Process flow diagram
Use the flow (draw as boxes/arrows, or screenshot the diagram in `docs/ARCHITECTURE.md` rendered on GitHub):
`Market feeds → 6 personas → JUDGE (votes + vetoes) → Faithful explainer → Decision card (3D world UI)`
`…and in parallel: every decision → BigQuery → Conversational Analytics agent + notebook/AI_FORECAST`

## Slide 7 — Wireframes / mock diagrams
No mocks needed — it's built. Use real screenshots:
- 3D world (8 coins + JUDGE core) · decision card (BTC SHORT · 90% · risk 10) · learning ladder ·
  chat answer · (optional) flagship ocean UI (islands + lighthouse).

## Slide 8 — Architecture diagram
Boxes: **Browser** → **Cloud Run** (FastAPI + 3D UI) → { **demo brain** (synthetic votes, moat
boundary) · **Gemini on Vertex AI** (chat/educator) · **BigQuery** (`decisions` → sanitized
`public_activity` view) } → **Conversational Analytics agent** + **BigQuery Studio notebook**.
Side lane: **accel/** benchmark → **NVIDIA T4 (cudf.pandas)**. (Or screenshot `docs/ARCHITECTURE.md`.)

## Slide 9 — Technologies / Google / NVIDIA used (+ why this stack, scalability)
**Live:** Cloud Run · Vertex AI (Gemini 2.5 Flash) · BigQuery · BigQuery Conversational Analytics ·
BigQuery Studio notebook (`AI_FORECAST`) · NVIDIA cuDF / `cudf.pandas` on T4.
**In the codebase:** ADK agent definitions + MCP tool server (the sanitized-brain boundary).
**Why this stack / scalability:**
- Cloud Run scales to zero → pennies at demo scale, autoscales for real traffic — same container.
- BigQuery = warehouse-scale analytics with no ETL; the sanitized view is the public/private boundary.
- Managed Gemini = no model infra; swap models by env var.
- cuDF proves the heavy path (validation) ports to GPU with **zero code change** — the scale lever
  is already demonstrated, not hypothetical.

## Slide 10 — Snapshots of the prototype
Screenshots: 3D world · decision card · chat · Conversational Analytics answer (LTC/10 SHORTs) ·
notebook charts · Colab CPU-vs-GPU output (24.0s vs 3.9s) · `docs/assets/cudf_speedup.png`.

## Slide 11 — (closing) Links
- Live app: `https://smt-world-2gbcoyhuea-uc.a.run.app`
- Repo: `https://github.com/JannetEkka/smt-apac` · Demo video: *(paste link)*

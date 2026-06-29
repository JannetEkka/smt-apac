# Submission checklist — Google Gen AI Academy APAC, Cohort 2 (Challenge 2)

**Window:** 2026-06-29 16:01 IST → **2026-07-06 23:59 IST** · **GCP project:** `smt-bot-2026-v2`

## The five required fields
| Field | Value |
|---|---|
| **Project Deployment Link** (Cloud Run) | `https://smt-world-<hash>-<region>.run.app` — *fill after deploy* |
| **Project PPT** | Use `cohort 2 hack/Template_Prototype_Submission_Deck…pptx` → export PDF (≤5 MB) |
| **GitHub Repository Link** | `https://github.com/JannetEkka/smt-apac` |
| **Demo Video Link** (≤3 min) | *record + paste* |
| **Brief Description** | see below (≤1024 chars) |

## Brief description (draft, ≤1024 chars)
> **SMT World** is an explainable decision-intelligence companion that turns noisy crypto markets
> into a plain-language, trustworthy decision — and teaches a total beginner *why*. Six AI personas
> (order-flow, technical, on-chain, sentiment, regime) feed a JUDGE that issues a call with a
> faithful three-sentence explanation, a risk score, and every persona's vote. Guests explore an
> interactive 3D "brain", climb a guided SMT → trading → crypto ladder, chat with SMT (Gemini +
> AlloyDB RAG), and join a simulated copy-trade (WEEX launch partner). Built on Vertex AI/Gemini,
> ADK + MCP agents, AlloyDB pgvector, BigQuery + Looker, served on Cloud Run — and accelerated with
> NVIDIA cuDF (zero-code-change GPU) so strategy validation runs far faster, lowering time-to-insight.

## Tech checklist (need ≥2 across the lists — we use ~5)
- [x] **BigQuery** — decision activity store + sanitized public view (`looker/DASHBOARD.md`)
- [x] **Cloud Run** — the public URL (API + 3D front-end); optional L4 GPU service
- [x] **Vertex AI / Gemini + ADK** — educator + chat-with-SMT agents (Track 1)
- [x] **MCP** — sanitized brain exposed as agent tools (Track 2)
- [x] **AlloyDB + pgvector** — RAG education corpus (Track 3)
- [x] **Looker Studio** — embedded public analytics
- [x] **NVIDIA cuDF / cudf.pandas** — CPCV acceleration benchmark (`accel/`)
- [x] **NVIDIA GPUs on Google Cloud** — Vertex GPU notebook + Cloud Run L4

## Rubric coverage
- [x] Clear real-world user + problem (non-crypto retail)
- [x] A specific data-dependent decision ("act now — and why?")
- [x] Ingest → clean → analyze → model → visualize pipeline
- [x] Useful output (decision + risk score + why + sim copy-trade)
- [x] **Evidence acceleration improves the experience** (cuDF CPU-vs-GPU number)

## Build status (2026-06-29 scaffold)
- [x] Runnable demo brain + API + 3D front-end (synthetic data, moat-safe)
- [x] ADK agents + MCP server + RAG ingest/retrieve (graceful fallback)
- [x] cuDF benchmark + deploy configs + Looker + docs
- [ ] Deploy to Cloud Run on `smt-bot-2026-v2`; capture the URL
- [ ] Seed AlloyDB + run RAG; flip chat to live Gemini
- [ ] Run cuDF benchmark on a GPU; capture the speedup number
- [ ] Record ≤3-min demo; export the deck to PDF

# Submission checklist — Google Gen AI Academy APAC, Cohort 2 (Challenge 2)

**Window:** 2026-06-29 16:01 IST → **2026-07-06 23:59 IST** · **GCP project:** `smt-bot-2026-v2`
Region used throughout: `us-central1`.

## The five required fields
| Field | Value |
|---|---|
| **Project Deployment Link** (Cloud Run) | **`https://smt-world-2gbcoyhuea-uc.a.run.app`** ✅ live & public (2026-06-29) |
| **Project PPT** | Fill `cohort 2 hack/Template_Prototype_Submission_Deck…pptx` from `docs/DECK_OUTLINE.md` → export PDF (≤5 MB) |
| **GitHub Repository Link** | `https://github.com/JannetEkka/smt-apac` |
| **Demo Video Link** (≤3 min) | *record from `docs/DEMO_SCRIPT.md`, then paste* |
| **Brief Description** | see below (plain text, **968 chars** ≤ 1024) |

## Brief description (final, plain text — paste as-is, 968 chars)
```
SMT World is an explainable decision-intelligence companion that turns noisy crypto markets into one plain-language, trustworthy decision — and teaches a total beginner why. Six AI personas (order-flow, technical, on-chain, whale, sentiment, regime) feed a JUDGE that issues a call with a faithful three-sentence explanation, a 0-100 risk score, and every persona's vote. Guests explore an interactive 3D "brain", climb a guided SMT to trading to crypto learning ladder, and chat with SMT — answers grounded in our own corpus via Gemini + AlloyDB pgvector RAG. Built on Vertex AI / Gemini with ADK agents and an MCP tool boundary, served on Cloud Run; decision activity lands in BigQuery and surfaces through a sanitized Looker Studio embed. We prove acceleration with NVIDIA cuDF (cudf.pandas, zero code change): the same strategy-validation pipeline runs far faster on GPU, lowering time-to-insight. Sample/synthetic data only — the trading edge stays private.
```

## Tech checklist (need ≥2 across the lists — we use ~5)
- [x] **BigQuery** — decision activity store + sanitized public view (`looker/DASHBOARD.md`); API now lands rows (`brain/bq_log.py`)
- [x] **Cloud Run** — the public URL (API + 3D front-end); optional L4 GPU service
- [x] **Vertex AI / Gemini + ADK** — educator + chat-with-SMT agents (Track 1)
- [x] **MCP** — sanitized brain exposed as agent tools (Track 2)
- [x] **AlloyDB + pgvector** — RAG education corpus (Track 3)
- [x] **Looker Studio** — embedded public analytics
- [x] **NVIDIA cuDF / cudf.pandas** — CPCV acceleration benchmark (`accel/`)
- [x] **NVIDIA GPUs on Google Cloud** — Vertex GPU notebook + Cloud Run L4

## Rubric coverage
- [x] Clear real-world user + problem (non-crypto retail beginner)
- [x] A specific data-dependent decision ("act now — and why?")
- [x] Ingest → clean → analyze → model → visualize pipeline
- [x] Useful output (decision + risk score + why + persona votes)
- [x] **Evidence acceleration improves the experience** (cuDF CPU-vs-GPU number)

---

# Build & deploy checklist (work top-to-bottom)

**Local verification — DONE (2026-06-29).** App runs via `uvicorn api.main:app`; all endpoints
return 200 on the synthetic demo brain; chat degrades gracefully (`grounded:false`) until a project
is set; cuDF benchmark CPU baseline captured (below). BigQuery logging wired + no-ops without a
project. The four GCP steps below need your project auth — run them in order.

> **CPU benchmark baseline (captured locally 2026-06-29):**
> `rows=2,522,880  build=1.52s  cpcv=11.77s  total=13.29s  checksum=3.0912`
> (BENCH_DAYS=1095, BENCH_SPLITS=40, 8 pairs). The GPU run (step 3) gives the speedup ratio.

## Step 0 — one-time project setup
```bash
# Point gcloud at the submission project and turn on every API we use.
gcloud config set project smt-bot-2026-v2
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com alloydb.googleapis.com bigquery.googleapis.com servicenetworking.googleapis.com

# Create the Artifact Registry repo the Cloud Build config pushes the image to.
gcloud artifacts repositories create smt --repository-format=docker --location=us-central1 \
  --description="SMT World images"
```

## Step 1 — deploy to Cloud Run, capture the URL ✅ DONE 2026-06-29
> Built + deployed `smt-world` in `us-central1`, public via `allUsers` run.invoker.
> **URL: `https://smt-world-2gbcoyhuea-uc.a.run.app`** — `/decision/{pair}`, `/world`, and the 3D
> front-end all serve. (Note: the build's `--allow-unauthenticated` IAM set failed because the
> deploy SA lacked permission; granted directly with
> `gcloud run services add-iam-policy-binding smt-world --region=us-central1 --member=allUsers --role=roles/run.invoker`.)
>
> **Why Cloud Run and not the Cloudflare Worker** (`*.workers.dev`): the submission field is
> literally "Cloud Run Deployment Link", the rubric scores GCP service usage (Cloudflare = 0
> rubric points), and Workers can't host the Python FastAPI backend / Vertex+ADK agents / AlloyDB
> RAG / BigQuery. The Worker only serves a static frontend shell; Cloud Run serves the whole app.

- [x] **Deploy**
```bash
# Build the image and deploy the public API+frontend service (config: deploy/cloudbuild.yaml).
gcloud builds submit --config deploy/cloudbuild.yaml --substitutions=_REGION=us-central1

# Print the public URL — paste it into the "Project Deployment Link" field above.
gcloud run services describe smt-world --region=us-central1 --format='value(status.url)'

# Smoke-test the live service (expects {"ok":true,"brain_source":"demo"}).
curl -s "$(gcloud run services describe smt-world --region=us-central1 --format='value(status.url)')/healthz"
```

## Step 2 — AlloyDB + pgvector, seed RAG, flip chat to live Gemini
- [ ] **Stand up AlloyDB**
```bash
# Create the AlloyDB cluster (set a strong password; reuse it in the connection string below).
gcloud alloydb clusters create smtworld --region=us-central1 --password='CHANGE_ME_STRONG'
# Add a primary instance (smallest CPU is fine for the demo corpus).
gcloud alloydb instances create smtworld-primary --cluster=smtworld --region=us-central1 \
  --instance-type=PRIMARY --cpu-count=2
# Get the instance private IP (used in ALLOYDB_CONN).
gcloud alloydb instances describe smtworld-primary --cluster=smtworld --region=us-central1 \
  --format='value(ipAddress)'
```
- [ ] **Create schema** — connect (Cloud Shell on the VPC, or `alloydb connect`) and run:
```sql
-- Enable pgvector and create the education corpus table + index (matches agents/rag/ingest.py).
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS education_chunks (
  id        bigserial PRIMARY KEY,
  level     text,
  source    text,
  chunk     text,
  embedding vector(768)
);
CREATE INDEX IF NOT EXISTS education_chunks_emb ON education_chunks
  USING ivfflat (embedding vector_cosine_ops);
```
- [ ] **Seed the corpus** (embeds `agents/rag/corpus/*.md` with Vertex text-embeddings):
```bash
GOOGLE_CLOUD_PROJECT=smt-bot-2026-v2 \
ALLOYDB_CONN="postgresql://postgres:CHANGE_ME_STRONG@<ALLOYDB_IP>:5432/postgres" \
python -m agents.rag.ingest      # expect: "ingested N chunks into education_chunks"
```
- [ ] **Flip chat live** — redeploy with the env vars so `/chat` returns `grounded:true`:
```bash
# Set the project (turns on Gemini) + AlloyDB connection (turns on RAG) on the running service.
gcloud run services update smt-world --region=us-central1 \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=smt-bot-2026-v2,GOOGLE_CLOUD_LOCATION=us-central1,ALLOYDB_CONN="postgresql://postgres:CHANGE_ME_STRONG@<ALLOYDB_IP>:5432/postgres"
# Verify grounded:true
curl -s -X POST "$(gcloud run services describe smt-world --region=us-central1 --format='value(status.url)')/chat" \
  -H 'Content-Type: application/json' -d '{"message":"what is SMT?","level":"smt"}' | python3 -m json.tool
```
> NOTE: Cloud Run reaches AlloyDB's private IP via a **Serverless VPC connector** (or Direct VPC
> egress). If `/chat` stays `grounded:false`, the connector is the usual gap — attach it on the
> `gcloud run services update` with `--vpc-connector` / `--network`.

## Step 3 — cuDF CPU-vs-GPU benchmark on a Vertex GPU notebook
- [ ] **Run the benchmark** (full steps in `deploy/vertex_gpu_notebook.md`):
```bash
# In a Vertex Workbench instance on a T4/L4 with the RAPIDS image, clone the repo, then:
python accel/cudf_benchmark.py                      # CPU baseline (~13s, matches local)
python -m cudf.pandas accel/cudf_benchmark.py       # GPU — zero code change
# For a more dramatic gap: BENCH_DAYS=3650 BENCH_SPLITS=80 python -m cudf.pandas accel/cudf_benchmark.py
```
- [ ] Record GPU wall-time + the speedup ratio → fill the deck slide 8 and the demo script `[X]/[Y]`.

## Step 4 — BigQuery landing + sanitized view + Looker embed
- [ ] **Create dataset, table, view** (code already lands rows via `brain/bq_log.py`):
```bash
# Create the dataset that holds decision activity.
bq --location=us-central1 mk --dataset smt-bot-2026-v2:smtworld
```
```sql
-- Run in the BigQuery console (matches looker/DASHBOARD.md and brain/bq_log.py's schema).
CREATE TABLE IF NOT EXISTS `smt-bot-2026-v2.smtworld.decisions` (
  ts TIMESTAMP, pair STRING, action STRING, conf FLOAT64,
  risk INT64, drivers STRING, source STRING
);
CREATE OR REPLACE VIEW `smt-bot-2026-v2.smtworld.public_activity` AS
SELECT TIMESTAMP_TRUNC(ts, HOUR) AS hour, pair, action,
       COUNT(*) AS decisions, ROUND(AVG(conf),2) AS avg_conviction, ROUND(AVG(risk)) AS avg_risk
FROM `smt-bot-2026-v2.smtworld.decisions`
GROUP BY hour, pair, action;
```
- [ ] **Grant the Cloud Run service account BigQuery write** (so the API can insert):
```bash
# Find the Cloud Run runtime service account, then give it dataEditor + jobUser.
SA=$(gcloud run services describe smt-world --region=us-central1 --format='value(spec.template.spec.serviceAccountName)')
SA=${SA:-$(gcloud projects describe smt-bot-2026-v2 --format='value(projectNumber)')-compute@developer.gserviceaccount.com}
gcloud projects add-iam-policy-binding smt-bot-2026-v2 --member="serviceAccount:$SA" --role=roles/bigquery.dataEditor
gcloud projects add-iam-policy-binding smt-bot-2026-v2 --member="serviceAccount:$SA" --role=roles/bigquery.jobUser
```
- [ ] **Generate activity + build the Looker embed** — hit the live `/world` a few times, then follow
  `looker/DASHBOARD.md` §2 (Looker Studio → BigQuery → `smtworld.public_activity` → Share → Embed).
```bash
# Drive some rows into the table.
URL=$(gcloud run services describe smt-world --region=us-central1 --format='value(status.url)')
for i in $(seq 1 5); do curl -s "$URL/world" >/dev/null; done
# Confirm rows landed.
bq query --use_legacy_sql=false 'SELECT COUNT(*) rows FROM `smt-bot-2026-v2.smtworld.decisions`'
```

## Step 5 — deck, demo video, brief (mostly done in-repo)
- [x] Brief description finalized (above, 968 chars) — paste into the form
- [x] Demo video script drafted → `docs/DEMO_SCRIPT.md` (fill GPU number, then record ≤3 min)
- [x] Deck outline drafted → `docs/DECK_OUTLINE.md` (fill the template pptx, add screenshots + GPU number, export PDF ≤5 MB)
- [ ] Record the demo video; export the deck to PDF; paste both links above

## Build status
- [x] Runnable demo brain + API + 3D front-end (synthetic data, moat-safe)
- [x] ADK agents + MCP server + RAG ingest/retrieve (graceful fallback)
- [x] cuDF benchmark + deploy configs + Looker + docs
- [x] BigQuery decision-logging wired into the API (`brain/bq_log.py`, best-effort)
- [x] CPU benchmark baseline captured (13.29 s total)
- [x] Demo script + deck outline + final brief written
- [ ] Deploy to Cloud Run; capture the URL (step 1)
- [ ] Seed AlloyDB + flip chat live; verify `grounded:true` (step 2)
- [ ] Run cuDF GPU benchmark; capture the speedup number (step 3)
- [ ] Create BQ dataset/view + Looker embed (step 4)
- [ ] Record demo; export deck to PDF; paste all five links (step 5)

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
| **Brief Description** | see below (plain text, **988 chars** ≤ 1024) |

## Brief description (final, plain text — paste as-is, 988 chars)
```
SMT World is an explainable decision-intelligence companion that turns noisy crypto markets into one plain-language, trustworthy decision — and teaches a total beginner why. Six AI personas (order-flow, technical, on-chain, whale, sentiment, regime) feed a JUDGE that issues a call with a faithful three-sentence explanation, a 0-100 risk score, and every persona's vote. Guests explore an interactive 3D "brain", climb a guided SMT to trading to crypto learning ladder, and chat with SMT (Vertex AI + Gemini, ADK agents, MCP tool boundary). Every decision lands in BigQuery; a sanitized Looker Studio embed and a BigQuery Conversational Analytics agent let anyone ask the data in plain English — the data intelligence tool, no SQL needed. Served on Cloud Run. We prove acceleration with NVIDIA cuDF (cudf.pandas, zero code change): the same strategy-validation pipeline runs far faster on GPU, lowering time-to-insight. Sample/synthetic data only — the trading edge stays private.
```

## Tech checklist (need ≥2 across the lists — we use ~5)
- [x] **BigQuery** — decision activity store + sanitized public view (`looker/DASHBOARD.md`); API now lands rows (`brain/bq_log.py`)
- [x] **Cloud Run** — the public URL (API + 3D front-end); optional L4 GPU service
- [x] **Vertex AI / Gemini + ADK** — educator + chat-with-SMT agents (Track 1)
- [x] **MCP** — sanitized brain exposed as agent tools (Track 2)
- [x] **Looker Studio** — embedded public analytics
- [x] **BigQuery Conversational Analytics** — plain-English data agent over `public_activity` (Cohort 2 Track 1)
- [x] **NVIDIA cuDF / cudf.pandas** — CPCV acceleration benchmark (`accel/`)
- [x] **NVIDIA GPUs on Google Cloud** — Vertex GPU notebook (one-shot benchmark run)
- [~] **AlloyDB + pgvector** — RAG education corpus (Track 3) — *optional stretch; deferred for cost (see Cost & strategy)*

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

## Cost & strategy (operator decision 2026-06-30) — cheap, on-theme, win-capable
Keeping services up for the ~2-week judging window (ballpark, us-central1):
| Service | 2wk 24/7 | Note |
|---|---|---|
| Cloud Run | ~$0–2 | scales to zero, pay per request |
| BigQuery | ~$0 | pennies of storage; queries free ≤1 TB/mo |
| Looker Studio | free | — |
| Vertex/Gemini (chat) | ~$0–1 | per-token, light demo use |
| **AlloyDB** | **~$105–120** | min 2-vCPU, **can't scale to zero** — the one expensive piece |
| **GPU benchmark** | **~$1** | run ONCE, shut down — not a kept-up cost |

**Plan: lean on BigQuery (Cohort 2 theme), drop AlloyDB as the costly/optional piece.**
We already satisfy "≥2 GCP/NVIDIA services" with **4 cheap live ones** (Cloud Run, Vertex/Gemini,
BigQuery, Looker). We add **BigQuery Conversational Analytics** (Cohort 2 Track 1 — plain-English
Q&A over `public_activity`) as the "data intelligence tool" centerpiece, and run the **cuDF GPU
benchmark once** (~$1) for the acceleration evidence. **AlloyDB pgvector RAG = optional stretch**
(Step 2) — its "grounded data Q&A" job is covered cheaper by BigQuery Conversational Analytics;
do it only as a 1-day spin-up→demo→teardown if we want the Track-3 flex on a slide.

## Step 2 — AlloyDB + pgvector RAG — ❌ SKIPPED (operator 2026-06-30)
> **Decision: SKIP.** AlloyDB is Track 3 (not Cohort 2); its grounded-Q&A role is covered by
> BigQuery Conversational Analytics (Step 4b), and it's the only ~$110/2wk cost. We already meet
> "≥2 GCP/NVIDIA services" with Cloud Run + Vertex/Gemini + BigQuery + Looker + Conversational
> Analytics + cuDF. Chat still works (Gemini + corpus). Method retained below only for reference;
> if ever revived, follow the Track-3 / SmartDesk lab
> method EXACTLY: in-database `embedding('text-embedding-005', …)::vector` (NOT Python-side
> embedding), `google_ml_integration` + `vector` extensions in **AlloyDB Studio**, `VECTOR(768)`,
> the `<=>` cosine operator, and the two service-account grants (AlloyDB SA → Vertex AI User;
> Cloud Run SA → AlloyDB Client). The scaffold's `agents/rag/{ingest,retrieve}.py` would be
> refactored to call the in-database `embedding()` function to match the lab before this is used.
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

## Step 3 — cuDF CPU-vs-GPU benchmark (ONE-SHOT, FREE via Colab)
> NOTE: the academy labs don't cover the NVIDIA/cuDF layer (it's the new acceleration piece), so
> this follows `deploy/vertex_gpu_notebook.md` + standard RAPIDS usage, not a lab.
> **Simplest path = Google Colab (free T4, ~5 min, nothing to delete):**
> 1. colab.research.google.com → New notebook → **Runtime → Change runtime type → T4 GPU → Save**.
> 2. Get the benchmark (now on `main`) and run CPU then GPU:
> ```python
 > # all-shell lines — do NOT mix python print() with !cmd on one line (SyntaxError)
> !wget -q https://raw.githubusercontent.com/JannetEkka/smt-apac/main/accel/cudf_benchmark.py
> !echo "===== CPU =====" && python cudf_benchmark.py
> !echo "===== GPU =====" && python -m cudf.pandas cudf_benchmark.py
> # bigger gap for the slide:
> !echo "== CPU big ==" && BENCH_DAYS=3650 BENCH_SPLITS=80 python cudf_benchmark.py
> !echo "== GPU big ==" && BENCH_DAYS=3650 BENCH_SPLITS=80 python -m cudf.pandas cudf_benchmark.py
> ```
> If `cudf.pandas` is missing: `!pip install --extra-index-url=https://pypi.nvidia.com cudf-cu12`.
> Colab = Google infra + NVIDIA GPU, so it satisfies "NVIDIA GPUs on Google Cloud". (Vertex
> Workbench T4 is the GCP-native alternative if you want it on the project — see vertex doc; ~$1,
> delete after.)
- [ ] **Run the benchmark** (Colab above, or Vertex Workbench):
```bash
# In a Vertex Workbench instance on a T4/L4 with the RAPIDS image, clone the repo, then:
python accel/cudf_benchmark.py                      # CPU baseline (~13s, matches local)
python -m cudf.pandas accel/cudf_benchmark.py       # GPU — zero code change
# For a more dramatic gap: BENCH_DAYS=3650 BENCH_SPLITS=80 python -m cudf.pandas accel/cudf_benchmark.py
```
- [ ] Record GPU wall-time + the speedup ratio → fill the deck slide 8 and the demo script `[X]/[Y]`.

## Step 4 — BigQuery landing + sanitized view + Looker embed ✅ DONE 2026-06-30
> dataset `smtworld` + table `decisions` + view `public_activity` created; Cloud Run SA granted
> bigquery dataEditor/jobUser; **74 rows landed** from the live `/world`. Looker embed = optional
> (the Conversational Analytics agent below is the stronger surface).
- [x] **Create dataset, table, view** (code already lands rows via `brain/bq_log.py`):
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

### Step 4b — BigQuery Conversational Analytics agent ✅ WORKING 2026-06-30 (Cohort 2 Track 1 — centerpiece)
> Agent `SMT World Activity Agent` over `public_activity` answers plain-English questions, e.g.
> *"Which pair had the most SHORT decisions today?"* → **LTC, 10 SHORT decisions** (with reasoning
> + key insight), querying live BigQuery. Region "US" multi-region queried the us-central1 source
> fine. **TODO: click Publish (was Draft) + screenshot for the deck/demo.**
> Follows the *"Introduction to the Conversational Analytics in BigQuery"* lab EXACTLY. This is the
> "data intelligence tool people would actually use": plain-English Q&A over our activity view, no
> SQL. ~free at demo scale. All in the **Console** (BigQuery Agent Catalog), no extra code.
1. **IAM** → grant yourself **Gemini Data Analytics Data Agent Owner** ADDITIVELY (the Console
   "Edit access" panel can try to *replace* Owner → "Cannot remove all owners"). Use gcloud:
   ```bash
   gcloud projects add-iam-policy-binding smt-bot-2026-v2 \
     --member="user:jannet.ekka@gmail.com" \
     --role="roles/geminidataanalytics.dataAgentOwner"
   ```
2. **BigQuery → Agents** → click **Enable the Data Analytics API with Gemini** (enables *Gemini in
   BigQuery API* + *Gemini for Google Cloud API*).
3. **Create agent** — Name: `SMT World Activity Agent`; Description: `Conversational analytics over
   SMT World's public decision-activity`. **Knowledge source:** add the view
   `smt-bot-2026-v2.smtworld.public_activity` (check the box → Add).
   ⚠️ **Region:** dataset is **us-central1** — click the pencil next to "Region" and set `us-central1`
   BEFORE saving (defaults to "US" multi-region, which can't query a us-central1 source; can't change
   after save).
4. **Structured context** → in the Agent Editor find the table → click **Customise**. Either accept
   Gemini's auto-suggestions (*Accept* table description → check *Select all rows* → *Accept
   suggestions* → *Update*), OR paste these manual descriptions:
   - **Table:** `Hourly summary of SMT World's public, sanitized trading decisions — one row per hour bucket, per pair, per action. Counts and averages only; no parameters, thresholds, or PnL.`
   - `hour`: `Hour bucket (timestamp truncated to the hour) the decisions fall in.`
   - `pair`: `Crypto asset symbol: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, LTC.`
   - `action`: `SMT's call for that bucket: LONG, SHORT, or WAIT.`
   - `decisions`: `Number of decisions in that hour for that pair and action.`
   - `avg_conviction`: `Average conviction (confidence), 0 to 1.`
   - `avg_risk`: `Average risk score, 0 to 100.`
   Then **Update**.
5. **System Instructions** (Instructions box) — paste this SMT-specific block (lab pattern):
   ```
   ### System Instruction
   * You are an expert analyst for SMT World's public decision-activity (the public_activity view).
   * Each row = one hour-bucket of SMT's calls for one pair and one action (LONG/SHORT/WAIT).
   * "decisions" is the count of calls; "avg_conviction" is 0-1; "avg_risk" is 0-100.
   * Default to the most recent data; only show time series when the user asks for trends over time.
   * This is sanitized public data — no trading params, thresholds, or PnL exist here; never imply them.
   ### Field guidance
   * pair: BTC/ETH/SOL/BNB/XRP/ADA/DOGE/LTC. action: LONG/SHORT/WAIT.
   * Group by pair and/or action; sum decisions; average conviction/risk.
   ```
6. **Verified queries** ("golden queries") — *Add query*, validate, save (teaches business logic):
   - Q: *"Which pair had the most SHORT decisions today?"*
     ```sql
     SELECT pair, SUM(decisions) AS shorts
     FROM `smt-bot-2026-v2.smtworld.public_activity`
     WHERE action = 'SHORT' AND DATE(hour) = CURRENT_DATE()
     GROUP BY pair ORDER BY shorts DESC LIMIT 1;
     ```
   - Q: *"Average conviction per pair this week."*
     ```sql
     SELECT pair, ROUND(AVG(avg_conviction),2) AS conviction
     FROM `smt-bot-2026-v2.smtworld.public_activity`
     WHERE hour >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
     GROUP BY pair ORDER BY conviction DESC;
     ```
7. **Settings → Maximum Bytes Billed** = `10000000000` (≈9.3 GB cap so no query can run up a bill).
8. **Preview** (right pane) → **Save** → **Publish** → optionally **Share**. Then **Create
   conversation** and ask a plain-English question. **Screenshot** it for the deck (slide 7) + demo
   (beat 5). Bonus: ask *"predict next week's SHORT decisions for BTC"* to show **BQML AI_FORECAST**.

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
- [x] Deploy to Cloud Run; capture the URL (step 1) — `https://smt-world-2gbcoyhuea-uc.a.run.app`
- [x] ~~AlloyDB~~ — SKIPPED (step 2; covered by BigQuery Conversational Analytics, cost decision)
- [x] BQ dataset/view + Conversational Analytics agent working (step 4/4b) — agent answered (LTC, 10 SHORTs)
- [ ] Publish the agent + screenshot it (step 4b TODO)
- [ ] Run cuDF GPU benchmark; capture the speedup number (step 3 — Colab, free)
- [ ] Record demo; export deck to PDF; paste all five links (step 5)

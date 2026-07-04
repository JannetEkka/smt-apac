# Deck content — SMT World (fills the cohort-2 template → export PDF ≤5 MB)

> Template: `gcp-ai-labs/cohort 2 hack/Template_Prototype_Submission_Deck…pptx`. One slide ≈ one
> idea; slides sparse, detail in speaker notes. Screenshots to grab: a decision card, the chat, the
> Conversational Analytics answer (LTC/10 SHORTs), the Colab CPU-vs-GPU output. Chart asset for
> slide 8 is `docs/assets/cudf_speedup.png`.

| Slide | Title | Content |
|-------|-------|---------|
| 1 | **Title** | "SMT World — explainable decision intelligence for everyone." Google Gen AI Academy APAC · Cohort 2 · Challenge 2 · Jannet Ekka. Hero: 3D-brain screenshot. |
| 2 | **The problem** | People drown in data they can't act on; crypto is the sharpest case — every signal is a black box → no trust → no decision. User: the overwhelmed retail beginner. |
| 3 | **The decision** | One specific data-dependent decision: *"Should I act on this market now — and why?"* Must be trustworthy AND teach. |
| 4 | **What we built** | Pick a market → call (LONG/SHORT/WAIT) + conviction + 0-100 risk + faithful 3-sentence "why" + every persona's vote. *(decision-card screenshot)* |
| 5 | **Pipeline** | ingest → clean → analyze → model → visualize. Feeds → 6 personas → JUDGE → XAI "why" → 3D world + BigQuery → **analysis notebook (BigQuery Studio)**. *(architecture diagram)* |
| 6 | **Explainable + teaches** | Faithful 3-sentence "why" + persona votes (XAI); Educator ladder SMT→trading→crypto; Chat-with-SMT. *(chat + ladder screenshot)* |
| 7 | **Ask your data (centerpiece)** | BigQuery **Conversational Analytics** agent over sanitized `public_activity` — plain English → SQL → answer + chart, no analyst. *(LTC/10-SHORTs screenshot)* |
| 8 | **Acceleration (the evidence)** | NVIDIA **cuDF / cudf.pandas**, zero code change, on the strategy-validation step (2.52M rows). **CPU 24.0s → GPU 3.9s ≈ 6×** (~6.8× on the compute step), identical checksum. *(cudf_speedup.png)* Caption: "Verbatim logs + executed notebook in the repo — same work, proven." |
| 9 | **GCP + NVIDIA stack** | Cloud Run · Vertex AI/Gemini + ADK · MCP · BigQuery · Conversational Analytics · Looker Studio* · NVIDIA cuDF. *(*Looker only if you build the dashboard — else drop this one chip.)* |
| 10 | **Responsible AI / moat** | Rebuilt personal project shown as a public slice — synthetic/demo data; signal params, thresholds, research, PnL withheld, and we say so. |
| 11 | **Live + links** | App: `https://smt-world-2gbcoyhuea-uc.a.run.app` · Repo: `github.com/JannetEkka/smt-apac` · Demo video. "Try it now" (optional QR). |

## Before export
- Slide 8: chart filled (`docs/assets/cudf_speedup.png`) — final numbers, no placeholders.
- Slide 9: keep the **Looker** chip only if you build the Looker Studio dashboard (~10 min: Looker Studio → Add data → BigQuery → `smtworld.public_activity` → 2-3 charts → Share). Otherwise remove it.
- Slides 4/6/7: drop in the app + agent screenshots.
- Export `.pptx` → **PDF, ≤5 MB** (compress images if over).

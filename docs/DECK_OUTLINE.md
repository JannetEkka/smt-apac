# Deck outline — SMT World (fills the cohort-2 template)

> Template: `gcp-ai-labs/cohort 2 hack/Template_Prototype_Submission_Deck _ Gen_AI_Academy_APAC_Edition.pptx`.
> Keep it concise (template is a prototype-submission deck). Export to **PDF ≤5 MB** for the upload.
> One slide ≈ one idea. Speaker notes can carry detail; slides stay sparse.

| Slide | Title | Content (bullets / visual) |
|-------|-------|----------------------------|
| 1 | **Title** | "SMT World — explainable decision intelligence for everyone." Subtitle: Google Gen AI Academy APAC · Cohort 2 · Challenge 2. Team / handle. The 3D-brain hero shot. |
| 2 | **The problem** | Communities & individuals drown in data they can't act on. Crypto is the sharpest case: every signal is a black box → no trust → no decision. Who: the overwhelmed retail beginner. |
| 3 | **The decision** | One specific, data-dependent decision: *"Should I act on this market now — and why?"* Output must be trustworthy AND teach. |
| 4 | **What we built** | SMT World: pick a market → get a call (LONG/SHORT/WAIT) + conviction + 0-100 risk score + a faithful 3-sentence "why" + every persona's vote. Screenshot of a decision card. |
| 5 | **Pipeline** | ingest → clean → analyze → model → visualize. Feeds → 6 personas → JUDGE → XAI "why" → 3D world + Looker. (Architecture diagram from docs/ARCHITECTURE.md.) |
| 6 | **Explainable + teaches** | The 3-sentence faithful "why" + persona votes (XAI). Educator ladder SMT→trading→crypto. Chat-with-SMT grounded via RAG. Screenshot of chat + ladder. |
| 7 | **GCP stack** | Vertex AI / Gemini + ADK (agents) · MCP (sanitized brain boundary) · AlloyDB pgvector (RAG) · BigQuery (activity) · Looker Studio (public embed) · Cloud Run (serves it all). Logo strip + one-line each. |
| 8 | **Acceleration (the evidence)** | NVIDIA cuDF / cudf.pandas, zero code change, on the CPCV strategy-validation step (2.52M rows). **CPU 24.0 s → GPU 3.9 s = ~6× faster** (~6.8× on the core compute), identical checksum. Bar chart. "Faster validation = faster, better decision." |
| 9 | **Responsible AI / moat** | Synthetic & sample data in public; signal params, thresholds, research, PnL withheld. Honesty about what's shown vs withheld = trust. (docs/MOAT.md.) |
| 10 | **Live + links** | Cloud Run URL · GitHub repo · demo video. "Try it now." QR to the live app. |

## To finalize before export
- Slide 8: GPU number filled (CPU 24.0s → GPU 3.9s, ~6×). Drop in a 2-bar chart + the Colab output screenshot.
- Slide 10: paste the live Cloud Run URL (`https://smt-world-2gbcoyhuea-uc.a.run.app`) + video link + repo (`github.com/JannetEkka/smt-apac`).
- Slides 4 & 6: drop in screenshots from the deployed app + the Conversational Analytics answer (LTC/10 SHORTs).
- Export `.pptx` → **PDF, ≤5 MB** (compress images if over).

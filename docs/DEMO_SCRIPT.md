# Demo video script — SMT World (≤3:00)

> Target: **2:45**. Screen-record the live Cloud Run URL; voice-over in plain language (judge =
> smart generalist, not a crypto trader). Show, don't tell. Every beat ties to a rubric line.

| # | Time | On screen | Voice-over (say roughly this) |
|---|------|-----------|-------------------------------|
| 1 | 0:00–0:20 | Title card → the 3D "SMT World" brain loading | "Most people can't act on markets because every signal is a black box. SMT World turns a noisy market into one plain-language decision — and tells you *why*. Here's SMT's brain: eight markets, six AI personas, live." |
| 2 | 0:20–0:50 | Click a pair (e.g. BTC) → decision card: action, conviction, risk score, the 3-sentence "why", persona votes | "I click BTC. SMT gives a call — LONG, SHORT or WAIT — a conviction, a 0-to-100 risk score, and a faithful three-sentence explanation. Below it, every persona's vote: order-flow, technical, on-chain, whale, sentiment, regime. Nothing hidden — this is explainable AI you can argue with." |
| 3 | 0:50–1:20 | The learn ladder: SMT → trading → crypto rungs | "A total beginner isn't left behind. The Educator agent climbs a ladder — what SMT is, then trading, then crypto — built on Vertex AI and Gemini with Google's Agent Development Kit." |
| 4 | 1:20–1:50 | Chat panel: ask "why is SMT cautious on ETH right now?" → grounded answer; point to `grounded: true` | "I can just ask. Chat-with-SMT answers in plain English, grounded in our own education corpus through AlloyDB pgvector RAG — so it teaches from our material, not hallucination. The MCP boundary means the agent only ever sees a *sanitized* brain." |
| 5 | 1:50–2:20 | Looker Studio embed: decisions-per-pair, action mix, avg-conviction over time | "Every decision lands in BigQuery and surfaces here — a sanitized Looker Studio dashboard of what SMT has been seeing. Counts and distributions only; never the strategy itself." |
| 6 | 2:20–2:45 | Colab output: CPU run vs `python -m cudf.pandas` GPU run → the speedup number | "And acceleration earns its place. Our strategy-validation pipeline — the heavy cross-validation step over 2.5 million rows — runs the *same* pandas code on an NVIDIA GPU with cuDF, zero code change. CPU took 24 seconds; the GPU does it in under 4 — about a 6× speedup, identical result. Faster validation means a faster, better decision in your hands." |
| 7 | 2:45–2:55 | URL + "synthetic data · edge stays private" caption | "SMT World — explainable decisions, anyone can use. Live link in the description. Thanks for watching." |

## Recording notes
- GPU number is final: **CPU 24.0s → GPU 3.9s ≈ 6×** (2.52M rows, identical checksum). No placeholders left.
- Keep the cursor deliberate; pause ~1s on each decision "why" so it's readable.
- Say "synthetic / sample data" at least once — honesty about the moat is a credibility win, not a weakness.
- Export ≤3:00. Upload unlisted YouTube (or Drive "anyone with link"); paste into SUBMISSION.md.

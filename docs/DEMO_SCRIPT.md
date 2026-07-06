# Demo video script — SMT World (≤3:00, target 2:45)

> Screen-record the live Cloud Run app (`https://smt-world-2gbcoyhuea-uc.a.run.app`). Read the
> voice-over in plain language — the judge is a smart generalist, not a crypto trader. Fill the GPU
> number is already final. Every beat maps to a scored rubric line.

| Time | On screen | Say (read aloud) |
|---|---|---|
| 0:00–0:20 | Title → 3D "brain" loading | "Most people can't act on crypto because every signal is a black box — you get a 'buy' with no reasoning and no way to learn. SMT World fixes that. This is SMT's brain: eight markets orbiting a central judge, each one a live, explained decision." |
| 0:20–0:50 | Click BTC → decision card (action, conviction, risk, the 3-sentence why, persona votes) | "I'll click Bitcoin. SMT gives a clear call — here it's a SHORT — with ninety-percent conviction and a risk score. Below it, a plain-English reason, and every one of the six personas' votes: order-flow, technical, whale, on-chain, sentiment, and regime. Nothing is hidden — this is explainable AI you can actually argue with." |
| 0:50–1:20 | The learn ladder: SMT → trading → crypto | "A total beginner isn't lost here. This ladder teaches them step by step — first what SMT is, then trading, then crypto — and the chat behind it runs on Gemini on Vertex AI." |
| 1:20–1:50 | Chat panel: ask "what's a short?" | "And they can just ask. I'll type 'what's a short?' — SMT answers warmly, in beginner language, grounded in its own teaching material." |
| 1:50–2:20 | BigQuery Conversational Analytics agent → "Which pair had the most SHORT decisions today?" → LTC / 10 | "Now the part anyone would actually use. In BigQuery, I ask in plain English — 'which pair had the most short calls today?' — and Conversational Analytics writes the SQL, runs it, and answers: LTC, ten short calls. No SQL, no analyst." |
| 2:20–2:45 | Colab output: CPU 24.0s vs GPU 3.9s | "Finally, speed. SMT's strategy-validation runs over two-and-a-half million rows. The same code on a CPU takes twenty-four seconds; on an NVIDIA GPU with cuDF — zero code changes — it's under four. Six times faster, identical result — the full logs and executed notebook are in the repo, so it's verifiable. Faster validation means fresher, better decisions." |
| 2:45–2:55 | URL + "demo data · edge stays private" | "SMT World: explainable decisions anyone can use. It runs on demo data — the real trading edge stays private. Thanks for watching." |

## Optional 5-sec cameo (only if comfortably under 3:00)
After beat 1, flash the flagship ocean UI (`smt-weex-trading-bot.jannet-ekka.workers.dev`, islands now
orbit): *"…and this same brain powers our full product interface."* Skip if tight on time.

## Recording notes
- GPU number is final: **CPU 24.0s → GPU 3.9s ≈ 6×** (2.52M rows, identical checksum). No placeholders.
- Pause ~1s on each decision "why" so it's readable; keep the cursor deliberate.
- Say "demo / sample data" at least once — honesty about the moat is a credibility win.
- Export ≤3:00. Upload unlisted YouTube (or Drive "anyone with link"); paste into SUBMISSION.md.

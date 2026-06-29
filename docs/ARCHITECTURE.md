# Architecture — SMT World

```
                              ┌──────────────────────────────┐
   Guest (no crypto knowledge)│   Front-end (Cloud Run)      │
        │  browser            │   Stitch HTML/Tailwind +     │
        ▼                     │   three.js "SMT World" 3D     │
   ┌─────────────┐  GET /world│   (frontend/)                │
   │  3D brain    ◀───────────┤                              │
   │  click pair  │  GET /decision/{pair}                    │
   │  learn ladder│  GET /education/{level}                  │
   │  chat        │  POST /chat                              │
   │  copy-trade  │                                          │
   └─────────────┘            └──────────────┬───────────────┘
                                             │ FastAPI (api/main.py)
                          ┌──────────────────┼───────────────────────────┐
                          ▼                  ▼                           ▼
                 ┌────────────────┐  ┌─────────────────┐      ┌────────────────────┐
                 │ brain/adapter  │  │ ADK agents       │      │ accel/ (offline)   │
                 │ demo│live      │  │ educator + chat  │      │ cudf.pandas CPCV   │
                 │ JUDGE+explain  │  │ (Vertex/Gemini)  │      │ CPU vs NVIDIA GPU  │
                 │ shape          │  │   │ MCP tools     │      └────────────────────┘
                 └───────┬────────┘  │   ▼               │
                         │           │ mcp_server (T2)   │
       synthetic votes ──┘           │   │ smt_retrieve   │
       (public)                      │   ▼               │
       live personas (private)       │ RAG (T3)          │
                                     │ AlloyDB pgvector  │
                                     └────────┬──────────┘
                                              ▼
                              BigQuery activity ──► Looker Studio (public embed)
```

## Request flow
1. **`/world`** → `brain/adapter.world()` → all-8-pairs decision snapshot → three.js nodes,
   colored by action, sized by conviction.
2. **`/decision/{pair}`** → one decision dict (`action / conf / why / drivers / votes / risk`).
3. **`/education/{level}`** → `agents/educator_agent.rung()` → corpus lesson (RAG-grounded when live).
4. **`/chat`** → `agents/smt_chat_agent.answer()` → RAG context + current reads → Gemini (Vertex),
   graceful fallback to corpus when unconfigured.

## Academy-track reuse
- **Track 1** (ADK + A2A): the two agents on Cloud Run.
- **Track 2** (ADK + MCP + BigQuery): the MCP server exposing the sanitized brain.
- **Track 3** (AlloyDB + vector search + Gemini Flash): the RAG education corpus.
- **Cohort 2** (BigQuery conversational analytics + BQML): the Looker activity panels.

## Moat boundary
The dashed line between `demo` and `live` in `brain/adapter.py` is the whole game: public = synthetic
votes in the real contract; private = live personas behind auth. See `MOAT.md`.

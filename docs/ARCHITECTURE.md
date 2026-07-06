# Architecture — SMT World

```mermaid
flowchart TB
    G["Guest (no crypto knowledge)<br/>browser"] --> FE["Front-end on Cloud Run<br/>Stitch HTML/Tailwind + three.js 3D world<br/>(frontend/)"]
    FE -->|"GET /world · GET /decision/{pair}<br/>GET /education/{level} · POST /chat"| API["FastAPI (api/main.py)"]

    API --> BRAIN["brain/adapter<br/>demo | live · JUDGE + explain shape"]
    API --> AGENTS["Agents (Vertex AI / Gemini)<br/>educator + chat<br/>ADK defs + MCP server in agents/"]
    API --> BQ["BigQuery<br/>smtworld.decisions →<br/>sanitized public_activity view"]

    BRAIN -. "synthetic votes (public)" .-> DEMO["demo_brain"]
    BRAIN -. "live personas (private, not in repo)" .-> MOAT["🔒 the moat"]

    BQ --> CA["Conversational Analytics agent<br/>plain-English Q&A, no SQL"]
    BQ --> NB["BigQuery Studio notebook<br/>activity charts + AI_FORECAST"]

    ACCEL["accel/ (offline, one-shot)<br/>cudf.pandas CPCV benchmark<br/>CPU 24.0s → NVIDIA GPU 3.9s (~6×)"]
```

## Process flow (data → decision → insight)

```mermaid
flowchart LR
    F["Market feeds"] --> P["6 personas<br/>flow · technical · whale<br/>onchain · sentiment · regime"]
    P --> J["JUDGE<br/>votes + vetoes"]
    J --> W["Faithful 'why'<br/>(flip-test verified)"]
    W --> D["Decision card<br/>action · conviction · risk<br/>3D World UI"]
    D --> B["BigQuery<br/>sanitized view"]
    B --> A["Conversational Analytics<br/>+ notebook (AI_FORECAST)"]
    V["Validation loop: CPCV on NVIDIA GPU (cuDF, ~6×)"] -.-> P
```

## Request flow
1. **`/world`** → `brain/adapter.world()` → all-8-pairs decision snapshot → three.js nodes,
   colored by action, sized by conviction; every call also lands sanitized rows in BigQuery.
2. **`/decision/{pair}`** → one decision dict (`action / conf / why / drivers / votes / risk`).
3. **`/education/{level}`** → `agents/educator_agent.rung()` → curated corpus lesson.
4. **`/chat`** → `agents/smt_chat_agent.answer()` → corpus context + current reads → Gemini
   (Vertex AI), graceful fallback to corpus when unconfigured.

## Academy-track reuse
- **Track 1** (ADK): agent definitions in `agents/`, served on Cloud Run.
- **Track 2** (MCP + BigQuery): `agents/mcp_server.py` exposes the sanitized brain as tools.
- **Cohort 2** (BigQuery conversational analytics + BQML): the Conversational Analytics agent +
  `AI_FORECAST` notebook over `public_activity`.
- **Track 3** (AlloyDB pgvector RAG): included in `agents/rag/` as an optional path, disabled for
  cost — Conversational Analytics covers the ask-the-data job.

## Moat boundary
The switch between `demo` and `live` in `brain/adapter.py` is the whole game: public = synthetic
votes in the real contract; private = live personas behind auth. See `MOAT.md`.

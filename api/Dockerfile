# SMT World API + static front-end → Cloud Run (CPU).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic \
    google-cloud-aiplatform google-adk mcp psycopg2-binary

COPY brain/ ./brain/
COPY agents/ ./agents/
COPY frontend/ ./frontend/
COPY api/ ./api/

# Cloud Run sets $PORT; serve API + the Stitch/three.js front-end from one service.
CMD exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT}

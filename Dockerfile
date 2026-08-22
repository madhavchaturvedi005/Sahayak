FROM python:3.11-slim AS builder
WORKDIR /opt/venv
RUN apt-get update && apt-get install -y build-essential && apt-get clean
COPY packages/requirements.txt ./requirements.txt
RUN python -m venv .
RUN . bin/activate && pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=development
WORKDIR /app

RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN mkdir -p app scripts alembic utils

COPY --from=builder /opt/venv /opt/venv
COPY app ./app/
COPY scripts ./scripts/
COPY alembic ./alembic/
COPY alembic.ini ./
COPY utils ./utils/
COPY start.sh ./

RUN chmod +x start.sh utils/wait_for_db.py

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000
ENTRYPOINT ["sh", "start.sh"]

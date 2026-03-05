FROM python:3.11.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

# Regenerate all model pkl files at build time using the installed library
# versions. This busts the Docker layer cache for stale binaries and ensures
# the correct XGBoost/LightGBM versions are used in every deployment.
RUN python3 backend/create_demo_models.py

CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}

FROM python:3.12-slim

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential curl git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy code
COPY . .

# make sure we have a socket directory and correct perms
RUN mkdir -p vector_store uploads

EXPOSE 8000

# HEALTH – use the ultra-light “ping” endpoint so it succeeds long
# before heavy model-loading finishes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=5 \
  CMD curl -fsSL http://localhost:8000/ping || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", \
     "--host", "0.0.0.0", "--port", "8000", "--log-level", "info", "--access-log"]
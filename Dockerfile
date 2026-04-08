FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p user data/uploads data/assets output \
    output/CutVideo output/CutAudio output/ComposeVideo output/VideoThumbs

ENV AITIGER_PORT=8777
ENV SAM3_ENABLED=0

EXPOSE 8777

CMD ["python", "server.py"]

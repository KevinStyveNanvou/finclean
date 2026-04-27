FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y nmap postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings

# Daphne remplace runserver pour gérer HTTP + WebSocket
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
FROM python:3.12-alpine

WORKDIR /app

COPY app.py .
COPY static ./static

ENV HOST=0.0.0.0 \
    PORT=3003

EXPOSE 3003

CMD ["python", "app.py"]

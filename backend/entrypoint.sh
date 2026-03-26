#!/bin/sh

echo "ENTRYPOINT RUNNING"
echo "⏳ Waiting for Postgres..."

# wait until postgres is ready
while ! nc -z postgres 5432; do
  sleep 1
done

echo "Postgres is up"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec daphne -b 0.0.0.0 -p 8000 core.asgi:application
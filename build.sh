#!/usr/bin/env bash
# build.sh — Render build script
# Runs once during deployment to install deps, collect static files, run migrations.
set -o errexit

pip install -r requirements.txt

# Collect Django static files (training graphs, admin CSS, etc.)
python manage.py collectstatic --no-input

# Run DB migrations
python manage.py migrate

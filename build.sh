#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate

# Seed demo users so login works immediately after deploy
python manage.py seed_users

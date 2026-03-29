# Deployment Guide — SigVerify

## Architecture
Single Django app serves both the REST API and the React frontend build.
One URL covers everything — no separate frontend hosting needed.

---

## Option A: Deploy to Render (Recommended)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sigverify.git
git push -u origin main
```

> Make sure `db.sqlite3` is NOT in `.gitignore` so demo users deploy with the app.
> The `.gitignore` already keeps it tracked by default.

### Step 2 — Create Render Web Service

1. Go to https://render.com → Sign Up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — confirm settings:
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn Signature_Verification.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
   - **Instance Type:** Free

### Step 3 — Set Environment Variables on Render

In Render dashboard → Environment tab, add:

| Key | Value |
|-----|-------|
| `DJANGO_SECRET_KEY` | (click Generate) |
| `DJANGO_DEBUG` | `False` |
| `ADMIN_LOGIN_ID` | `admin` |
| `ADMIN_PASSWORD` | `admin` |

### Step 4 — Deploy

Click **Deploy**. First deploy takes ~5-10 minutes (installing TensorFlow).

Your app will be live at:
```
https://sigverify-backend.onrender.com
```

---

## Option B: Deploy to Railway

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Railway auto-detects `Procfile`
4. Add environment variables (same as above)
5. Deploy → get URL like `https://sigverify.up.railway.app`

---

## ⚠️ Important Notes

### SQLite on Render
Render's free tier has **ephemeral disk** — SQLite data resets on redeploy.
For a permanent demo, either:
- Add a **PostgreSQL** database on Render (free tier available), or
- Keep using SQLite and re-seed users after each deploy via the Django admin panel

### TensorFlow Memory
The ML model needs ~400MB RAM. Render free tier has 512MB.
If the app crashes on startup, upgrade to the **Starter** plan ($7/month) for 512MB guaranteed.

### Media Files
Uploaded signature images (`/media/`) are also ephemeral on Render free tier.
This is fine for demo purposes.

---

## Credentials

| Role | Login ID | Password | URL |
|------|----------|----------|-----|
| User | `123` | `Pavani@15` | `/login` |
| User | `alex` | `Alex@141` | `/login` |
| Admin | `admin` | `admin` | `/admin/login` |

---

## Generate QR Code for Deployed URL

Once deployed, run locally:

```bash
python generate_qr.py --url https://your-app.onrender.com
```

Or use any online QR generator with your Render URL.

---

## Demo Explanation (What to Tell Your Guide)

> "This is a Signature Verification System built with Django REST Framework and React.
> The backend uses a Siamese Neural Network trained on thousands of genuine and forged
> signature pairs. Users upload two signature images, and the model computes the
> Euclidean distance between their feature vectors — if the distance is below 0.5,
> the signatures match.
>
> The app is deployed on Render as a single-server application — Django serves both
> the API and the React frontend. It's accessible globally via a permanent HTTPS URL,
> with JWT-based authentication, admin user management, and training simulation with
> live metrics and graphs."

### Key Features to Highlight
- Siamese Neural Network for one-shot signature comparison
- JWT authentication (no sessions, works on mobile)
- Admin panel to activate/deactivate users
- Training simulation with confusion matrix and accuracy graphs
- Single-server architecture — one URL, one deployment
- Works on any device via QR code

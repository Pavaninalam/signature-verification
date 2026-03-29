"""
run_app.py  —  Signature Verification App Launcher
====================================================
Single-server: Django serves BOTH the React build AND the API on port 8000.
One ngrok tunnel → one public HTTPS URL → works on any device, any network.

Usage:
    python run_app.py                        # full start (builds React)
    python run_app.py --skip-build           # skip React build (faster restart)
    python run_app.py --set-token TOKEN      # save ngrok token then run
    python run_app.py --local-only           # LAN only, no ngrok

Get a FREE ngrok token:
    1. https://ngrok.com → Sign Up
    2. https://dashboard.ngrok.com/get-started/your-authtoken
    3. python run_app.py --set-token <your-token>
"""

import os, sys, time, socket, signal, subprocess, threading, argparse, urllib.request, json

ROOT_DIR  = os.path.dirname(os.path.abspath(__file__))
REACT_DIR = os.path.join(ROOT_DIR, "signature-react")
NGROK_CFG = os.path.join(os.path.expanduser("~"), "AppData", "Local", "ngrok", "ngrok.yml")

# ── Auto-install dependencies ─────────────────────────────────────────────────
def pip(pkg):
    subprocess.run([sys.executable, "-m", "pip", "install", pkg, "-q"], check=True)

try:
    import qrcode
except ImportError:
    print("Installing qrcode..."); pip("qrcode[pil]"); import qrcode

try:
    from pyngrok import ngrok, conf
    from pyngrok.exception import PyngrokNgrokError
except ImportError:
    print("Installing pyngrok..."); pip("pyngrok")
    from pyngrok import ngrok, conf
    from pyngrok.exception import PyngrokNgrokError

# ── Args ──────────────────────────────────────────────────────────────────────
ap = argparse.ArgumentParser()
ap.add_argument("--set-token",  metavar="TOKEN")
ap.add_argument("--local-only", action="store_true")
ap.add_argument("--skip-build", action="store_true")
args = ap.parse_args()

# ── ngrok token helpers ───────────────────────────────────────────────────────
def get_stored_token():
    if not os.path.exists(NGROK_CFG):
        return None
    with open(NGROK_CFG) as f:
        for line in f:
            if line.strip().startswith("authtoken:"):
                t = line.split(":", 1)[1].strip()
                if t and t != "YOUR_TOKEN_HERE" and len(t) > 20:
                    return t
    return None

def save_token(t):
    ngrok.set_auth_token(t)

if args.set_token:
    save_token(args.set_token)
    print("Token saved.\n")

# ── Utilities ─────────────────────────────────────────────────────────────────
def local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80)); return s.getsockname()[0]
    finally:
        s.close()

def kill_port(port):
    try:
        r = subprocess.run(
            f'netstat -ano | findstr ":{port} " | findstr LISTENING',
            shell=True, capture_output=True, text=True)
        for line in r.stdout.strip().splitlines():
            pid = line.split()[-1]
            if pid.isdigit() and int(pid) > 0:
                subprocess.run(f"taskkill /PID {pid} /F", shell=True, capture_output=True)
                print(f"  Killed PID {pid} on port {port}")
    except Exception:
        pass

def stream(proc, label):
    for line in iter(proc.stdout.readline, b""):
        txt = line.decode("utf-8", errors="replace").rstrip()
        if txt:
            print(f"  [{label}] {txt}")

def make_qr(url, path="qr_code.png"):
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(url); qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(path)

def print_qr(url):
    qr = qrcode.QRCode(box_size=1, border=2)
    qr.add_data(url); qr.make(fit=True)
    qr.print_ascii(invert=True)

def django_alive():
    """Return True if Django is responding on port 8000."""
    try:
        req = urllib.request.Request(
            "http://localhost:8000/api/health/",
            headers={"User-Agent": "healthcheck"}
        )
        with urllib.request.urlopen(req, timeout=4) as r:
            return r.status == 200
    except Exception:
        return False

def start_django():
    proc = subprocess.Popen(
        [sys.executable, "manage.py", "runserver", "0.0.0.0:8000"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        cwd=ROOT_DIR,
    )
    threading.Thread(target=stream, args=(proc, "Django"), daemon=True).start()
    return proc

def get_ngrok_url():
    """Get the active ngrok public URL from the local API."""
    try:
        with urllib.request.urlopen("http://localhost:4040/api/tunnels", timeout=5) as r:
            data = json.loads(r.read())
        for t in data.get("tunnels", []):
            url = t.get("public_url", "")
            if url.startswith("https://"):
                return url
        for t in data.get("tunnels", []):
            url = t.get("public_url", "")
            if url.startswith("http://"):
                return "https://" + url[7:]
    except Exception:
        pass
    return None

# ── Shutdown ──────────────────────────────────────────────────────────────────
_procs = []

def shutdown(sig=None, frame=None):
    print("\n\nShutting down...")
    for p in _procs:
        try: p.terminate()
        except Exception: pass
    try: ngrok.kill()
    except Exception: pass
    sys.exit(0)

signal.signal(signal.SIGINT,  shutdown)
signal.signal(signal.SIGTERM, shutdown)

# ═════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    ip = local_ip()

    print("\n" + "="*60)
    print("  SigVerify — Launcher")
    print("="*60)

    # 1. Kill stale ports
    print("\n[1/5] Clearing ports...")
    kill_port(8000); kill_port(3000)
    time.sleep(1)
    print("  Done.")

    # 2. Build React
    if not args.skip_build:
        print("\n[2/5] Building React app (use --skip-build next time)...")
        r = subprocess.run(["npm", "run", "build"], cwd=REACT_DIR,
                           shell=True, capture_output=True, text=True)
        if r.returncode != 0:
            print("BUILD FAILED:\n", r.stdout[-1500:], r.stderr[-1500:])
            sys.exit(1)
        print("  React build OK.")
    else:
        print("\n[2/5] Skipping React build.")

    # 3. ngrok tunnel
    public_url  = f"http://{ip}:8000"
    using_ngrok = False

    if not args.local_only:
        print("\n[3/5] Starting ngrok tunnel → port 8000...")
        token = get_stored_token()
        if not token and sys.stdin.isatty():
            print("  No ngrok token found.")
            print("  Get one free at https://dashboard.ngrok.com/get-started/your-authtoken")
            token = input("  Paste token (or press Enter to skip): ").strip()
            if len(token) < 20:
                token = None

        if token:
            save_token(token)
            try:
                cfg = conf.get_default()
                cfg.log_event_callback = None
                cfg.region = "in"   # India/Asia region — lowest latency
                tunnel = ngrok.connect(addr="8000", proto="http", pyngrok_config=cfg)

                # Extract URL — try attribute first, then local API
                url = (getattr(tunnel, "public_url", None)
                       or (tunnel.data.get("public_url") if hasattr(tunnel, "data") else None)
                       or get_ngrok_url())

                if url:
                    if url.startswith("http://"):
                        url = "https://" + url[7:]
                    public_url  = url
                    using_ngrok = True
                    print(f"  Tunnel active → {public_url}")
                else:
                    print("  ngrok started but URL not found.")
                    print("  Open http://localhost:4040 to find your URL manually.")

            except PyngrokNgrokError as e:
                print(f"  ngrok error: {e}")
            except Exception as e:
                print(f"  ngrok failed: {e}")
        else:
            print("  No token — using LAN IP only.")
    else:
        print("\n[3/5] Skipping ngrok (--local-only).")

    # 4. Start Django
    print("\n[4/5] Starting Django on 0.0.0.0:8000...")
    django = start_django()
    _procs.append(django)

    # Wait up to 20s for Django to be ready
    print("  Waiting for Django to be ready", end="", flush=True)
    for _ in range(20):
        time.sleep(1)
        print(".", end="", flush=True)
        if django_alive():
            break
    print()

    if not django_alive():
        print("\n  ERROR: Django did not start. Check output above.")
        shutdown()

    print("  Django is ready ✓")

    # 5. QR code
    print("\n[5/5] Generating QR code...")
    make_qr(public_url)
    print_qr(public_url)

    # Summary
    tag = "GLOBAL (any network)" if using_ngrok else "LOCAL (same WiFi only)"
    print("\n" + "="*60)
    print(f"  APP READY — {tag}")
    print("="*60)
    print(f"\n  Public URL  →  {public_url}")
    print(f"  Local       →  http://localhost:8000")
    print(f"  LAN         →  http://{ip}:8000")
    print(f"  Health      →  {public_url}/api/health/")
    print(f"\n  Login credentials:")
    print(f"    User   →  123 / Pavani@15  or  alex / Alex@141")
    print(f"    Admin  →  admin / admin  (at /admin/login)")
    print(f"\n  QR saved to qr_code.png — scan to open on mobile")
    if not using_ngrok:
        print(f"\n  For global access: python run_app.py --set-token YOUR_TOKEN")
    print(f"\n  Keep this window open while using the app on mobile.")
    print(f"  Press Ctrl+C to stop.\n")
    print("="*60 + "\n")

    # Keep-alive watchdog — auto-restarts Django and ngrok if they drop
    try:
        consecutive_failures = 0
        while True:
            time.sleep(3)

            # ── Restart Django if it crashed ──────────────────────────
            if django.poll() is not None:
                print("\n  Django stopped — restarting...")
                django = start_django()
                _procs.append(django)
                time.sleep(5)
                consecutive_failures = 0
                continue

            # ── Restart Django if it stopped responding ────────────────
            if not django_alive():
                consecutive_failures += 1
                if consecutive_failures >= 5:
                    print("\n  Django not responding — restarting...")
                    django.terminate()
                    time.sleep(2)
                    django = start_django()
                    _procs.append(django)
                    time.sleep(5)
                    consecutive_failures = 0
            else:
                consecutive_failures = 0

            # ── Reconnect ngrok if tunnel dropped ─────────────────────
            if using_ngrok:
                live_url = get_ngrok_url()
                if not live_url:
                    print("\n  ngrok tunnel dropped — reconnecting...")
                    try:
                        ngrok.kill()
                        time.sleep(2)
                        cfg = conf.get_default()
                        cfg.log_event_callback = None
                        cfg.region = "in"
                        tunnel = ngrok.connect(addr="8000", proto="http", pyngrok_config=cfg)
                        new_url = (getattr(tunnel, "public_url", None)
                                   or (tunnel.data.get("public_url") if hasattr(tunnel, "data") else None)
                                   or get_ngrok_url())
                        if new_url:
                            if new_url.startswith("http://"):
                                new_url = "https://" + new_url[7:]
                            public_url = new_url
                            make_qr(public_url)
                            print(f"\n  New ngrok URL → {public_url}")
                            print(f"  New QR saved to qr_code.png — rescan on mobile!")
                            print_qr(public_url)
                        else:
                            print("  Could not get new ngrok URL. Check http://localhost:4040")
                    except Exception as e:
                        print(f"  ngrok reconnect failed: {e}")

    except KeyboardInterrupt:
        shutdown()

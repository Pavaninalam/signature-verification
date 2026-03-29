"""
generate_qr.py
==============
Generates a QR code for the app.

Usage:
    python generate_qr.py              # uses local IP (same WiFi)
    python generate_qr.py --ngrok      # opens ngrok tunnel (global access)
    python generate_qr.py --url https://your-url.ngrok-free.app  # custom URL

QR image saved as qr_code.png in the project root.
"""
import sys
import socket
import argparse

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    finally:
        s.close()

def make_qr(url, filename='qr_code.png'):
    try:
        import qrcode
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'qrcode[pil]', '--quiet'])
        import qrcode

    # Save PNG
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    img.save(filename)

    # Print ASCII in terminal
    qr2 = qrcode.QRCode(box_size=1, border=2)
    qr2.add_data(url)
    qr2.make(fit=True)
    qr2.print_ascii(invert=True)

parser = argparse.ArgumentParser()
parser.add_argument('--ngrok',  action='store_true', help='Open ngrok tunnel for global access')
parser.add_argument('--url',    metavar='URL',        help='Use a specific URL for the QR code')
args = parser.parse_args()

ip = get_local_ip()

if args.url:
    # User provided a specific URL
    frontend_url = args.url
    print(f'\n  Using custom URL: {frontend_url}')

elif args.ngrok:
    # Open ngrok tunnel
    try:
        from pyngrok import ngrok, conf
        from pyngrok.exception import PyngrokNgrokError
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyngrok', '--quiet'])
        from pyngrok import ngrok, conf
        from pyngrok.exception import PyngrokNgrokError

    print('\n  Opening ngrok tunnel on port 3000...')
    try:
        conf.get_default().log_event_callback = None
        tunnel = ngrok.connect(3000, 'http')
        frontend_url = tunnel.public_url
        if frontend_url.startswith('http://'):
            frontend_url = frontend_url.replace('http://', 'https://', 1)
        print(f'  ngrok tunnel active ✓')
    except PyngrokNgrokError as e:
        print(f'\n  ⚠  ngrok failed: {e}')
        print("""
  To use ngrok for global access:
    1. Sign up free at https://ngrok.com
    2. Get token: https://dashboard.ngrok.com/get-started/your-authtoken
    3. Save token: python run_app.py --set-token YOUR_TOKEN
    4. Then run:   python generate_qr.py --ngrok
""")
        frontend_url = f'http://{ip}:3000'

else:
    # Default: local IP
    frontend_url = f'http://{ip}:3000'

print(f'\n  Frontend  →  {frontend_url}')
print(f'  Backend   →  http://{ip}:8000')
print()

make_qr(frontend_url)

print(f'\n  QR saved  →  qr_code.png')
print(f'  Scan to open: {frontend_url}')
print()
print('  Credentials:')
print('    User  →  123 / Pavani@15')
print('    User  →  alex / Alex@141')
print('    Admin →  admin / admin')
print()

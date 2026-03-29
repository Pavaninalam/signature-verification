# SigVerify Mobile — React Native (Expo)

Native Android/iOS app for the Signature Verification system.

---

## Setup (one time)

```bash
# 1. Install Node.js 18+ if not installed
# 2. Install Expo CLI
npm install -g expo-cli

# 3. Install dependencies
cd sigverify-mobile
npm install

# 4. Install Expo Go on your Android phone
#    Play Store → search "Expo Go"
```

---

## Configure Backend URL

Open `src/services/api.js` and set `BASE_URL` to your laptop's IP:

```js
// Option A: Same WiFi (LAN)
export const BASE_URL = 'http://192.168.1.100:8000';

// Option B: ngrok (any network)
export const BASE_URL = 'https://xxxx.ngrok-free.app';
```

Find your laptop IP:
- Windows: run `ipconfig` → look for IPv4 Address
- The URL printed by `python run_app.py` shows both options

---

## Run

**Terminal 1 — Start Django backend:**
```bash
python run_app.py --skip-build
```

**Terminal 2 — Start Expo:**
```bash
cd sigverify-mobile
npx expo start
```

A QR code appears in the terminal.
Open **Expo Go** on your phone → scan the QR code.

---

## Credentials

| Role  | Login ID | Password | Screen |
|-------|----------|----------|--------|
| User  | `123`    | `Pavani@15` | Login |
| User  | `alex`   | `Alex@141`  | Login |
| Admin | `admin`  | `admin`     | Admin Login |

---

## Troubleshooting

**"Network request failed"**
- Make sure Django is running: `python run_app.py --skip-build`
- Check `BASE_URL` in `src/services/api.js` matches your laptop IP
- Phone and laptop must be on the same WiFi (for LAN mode)
- Or use ngrok URL for any network

**"Session expired"**
- Log out and log in again

**Images not uploading**
- Grant camera/photo permissions when prompted
- Works with JPEG, PNG from camera or gallery

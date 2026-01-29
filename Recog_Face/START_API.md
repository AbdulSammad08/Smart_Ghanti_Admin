# Quick Start: Recog_Face API Server

## Prerequisites
- **Python 3.10** ✓ installed via winget
- **Virtual environment** ✓ created at `C:\Users\abdul\Documents\FYP\.venv`
- **Firebase credentials** must exist at: `c:\Users\abdul\Documents\FYP\backend\config\firebase-service-account.json`

## Current Status
✅ **API Server is ready** – Flask + Firebase dependencies installed  
✅ **Lazy-load architecture** – Heavy ML models load on first recognition request  
⏳ **Pending**: Install TensorFlow/DeepFace for recognition (optional pre-install)

## Start the API

```powershell
cd C:\Users\abdul\Documents\FYP\Recog_Face
C:\Users\abdul\Documents\FYP\.venv\Scripts\python.exe api.py
```

**Server starts on:**
- `http://127.0.0.1:5000`
- `http://192.168.0.109:5000` (local network)

## Endpoints

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/health`         | Health check (no heavy dependencies) |
| GET    | `/status`         | Sync status + Firebase info          |
| POST   | `/recognize`      | Full face recognition                |
| POST   | `/authenticate`   | Simple yes/no face auth              |
| POST   | `/sync-visitors`  | Manually trigger visitor sync        |

## Test the Server

```powershell
# Health check (no models required)
Invoke-WebRequest http://127.0.0.1:5000/health | Select-Object -ExpandProperty Content

# Sync status (requires Firebase + init_system to run once)
Invoke-WebRequest http://127.0.0.1:5000/status | Select-Object -ExpandProperty Content
```

## Install Full ML Stack (Optional Pre-Install)

To pre-install recognition models before first use:

```powershell
C:\Users\abdul\Documents\FYP\.venv\Scripts\python.exe -m pip install --no-input tensorflow==2.13.0 keras==2.13.1 scipy==1.11.3 opencv-python==4.8.0.74 Pillow==12.0.0 deepface==0.0.96 keras-vggface==0.6 ultralytics==8.3.235 torch==2.4.1 torchvision==0.19.1
```

**Note:** This installs ~2GB of packages. Skip if you want fast startup; models will auto-install on first recognition request.

## Next Steps

1. **Configure Firebase** (see Flutter prompt below for visitor setup)
2. **Test `/recognize` endpoint** with ESP32CAM or sample image
3. **Monitor `/status`** for sync health

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: cv2` | Already fixed with lazy imports |
| Firebase credentials not found | Place at `backend/config/firebase-service-account.json` |
| Port 5000 busy | Change `app.run(port=5000)` in `api.py` to another port |

## What's Next?

- Set up Flutter app to upload visitor images (see prompt below)
- Trigger a full sync: `POST http://127.0.0.1:5000/sync-visitors`
- Monitor background sync: every 5 minutes automatic

---

**Status**: ✅ API server runs successfully with Flask + Firebase + lazy ML model loading

# 🔍 DEBUGGING & VERIFICATION CHECKLIST

Use this checklist to verify each component of your face recognition system is working.

---

## ✅ PRE-SETUP CHECKLIST

### Environment
- [ ] Python 3.10 installed: `python --version`
- [ ] Virtual environment active: `.venv/Scripts/activate`
- [ ] Dependencies installed: `pip list | grep tensorflow`
  - Should see: tensorflow, numpy, supabase, firebase-admin

### Credentials
- [ ] Supabase credentials in `.env`: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Firebase credentials at: `backend/config/firebase-service-account.json`
- [ ] MongoDB credentials (if using): `MONGODB_URI` environment variable

---

## ✅ STEP 1 VERIFICATION: SQL Column Added

### Check in Supabase Console:

```sql
-- Run in SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visitors' 
ORDER BY ordinal_position;
```

**Expected output:** Should include:
```
id              | uuid
name            | text
status          | text
image_urls      | jsonb
metadata        | jsonb
created_at      | timestamp with time zone
updated_at      | timestamp with time zone
face_embeddings | jsonb        ← Must see this!
```

### If not there:
```sql
-- Run this to add it
ALTER TABLE visitors 
ADD COLUMN face_embeddings jsonb DEFAULT NULL;
```

---

## ✅ STEP 2 VERIFICATION: Image URLs Present

### Check visitor image URLs:

```sql
-- In Supabase SQL Editor
SELECT 
  name,
  CASE 
    WHEN image_urls IS NULL THEN 'NULL'
    WHEN image_urls = '[]'::jsonb THEN 'EMPTY'
    ELSE 'HAS URLS'
  END as image_urls_status,
  CASE 
    WHEN image_urls IS NULL THEN 0
    WHEN image_urls = '[]'::jsonb THEN 0
    ELSE jsonb_array_length(image_urls)
  END as num_images
FROM visitors
ORDER BY name;
```

**Expected output:**
```
name      | image_urls_status | num_images
John Doe  | HAS URLS          | 4
Jane Smith| HAS URLS          | 2
...
```

### If NULL or EMPTY:
1. Go to Supabase Storage (or Firebase Storage)
2. Get public URLs for each image
3. Update in SQL:
```sql
UPDATE visitors SET image_urls = 
  '["url1.jpg", "url2.jpg", "url3.jpg", "url4.jpg"]'::jsonb
WHERE name = 'John Doe';
```

---

## ✅ STEP 3 VERIFICATION: Embeddings Generated

### Before running generator:
```sql
SELECT COUNT(*) as visitors_with_embeddings
FROM visitors 
WHERE face_embeddings IS NOT NULL;
-- Expected: 0 (before generating)
```

### Run embedding generator:
```bash
cd Recog_Face
python generate_embeddings.py
```

### After running generator:
```sql
-- Check results
SELECT 
  name,
  status,
  CASE 
    WHEN face_embeddings IS NULL THEN 0
    ELSE jsonb_array_length(face_embeddings)
  END as num_embeddings
FROM visitors
WHERE face_embeddings IS NOT NULL
ORDER BY name;
```

**Expected output:**
```
name      | status | num_embeddings
John Doe  | active | 4
Jane Smith| active | 2
```

### If still 0:
- [ ] Check logs: `Recog_Face/logs/face_recognition.log`
- [ ] Verify image URLs are accessible (test in browser)
- [ ] Check image quality (must have clear faces)
- [ ] Run debug script: `python debug_supabase_embeddings.py`

---

## ✅ STEP 4 VERIFICATION: API Running

### Start API:
```bash
cd Recog_Face
python api.py
```

### Expected output:
```
[SYSTEM] Loading configuration...
[SYSTEM] Initializing Firebase...
[SYSTEM] ✓✓✓ System ready! Face recognition active ✓✓✓
[DOORBELL] 👀 Listening to Firebase /doorbell_events...
```

### Test API health:
```bash
curl http://localhost:5000/health
# Should return: 200 OK with { "status": "ok" }
```

### If API crashes:
- [ ] Check .env file: `cat Recog_Face/.env`
- [ ] Verify Supabase credentials are correct
- [ ] Check Firebase credentials path exists
- [ ] Run: `python -c "import tensorflow; print('OK')"`

---

## ✅ STEP 5 VERIFICATION: Recognition Working

### Check Firebase doorbell events:

Go to **Firebase Console** → **Realtime Database** → `/doorbell_events`

**Expected:**
- Hundreds of events
- Each with base64 image
- Timestamps

### Check recognition results:

Go to **Firebase Console** → **Realtime Database** → `/recognition_results`

**Before fix:**
```
image_xxx_1: {
  "recognized": false,
  "name": "unclassified",    ← This is the problem
  "error": "No active visitors with embeddings"
}
```

**After fix:**
```
image_xxx_1: {
  "recognized": true,
  "name": "John Doe",         ← Now shows name!
  "confidence": 0.85,
  "distance": 0.28,
  "authorized": true
}
```

### If still showing "unclassified":
1. [ ] Verify embeddings exist: Run SQL query above
2. [ ] Check doorbell image quality
3. [ ] Increase threshold: Edit `Recog_Face/.env`: `FACE_MATCH_THRESHOLD=0.7`
4. [ ] Check logs for errors: `Recog_Face/logs/face_recognition.log`

---

## ✅ STEP 6 VERIFICATION: Flutter App Receiving Results

### Check app is receiving FCM:

In Flutter app logs, should see:
```
I/Firebase: FCM token: eVu-...
D/FCMService: Notification received: facial_recognition
D/RecognitionService: New result: {name: John Doe, ...}
```

### Check app displays result:

1. Open Flutter app
2. Go to **Facial Recognition** tab
3. Should see recent results:
   ```
   ✅ JOHN DOE - 2:45 PM
   Confidence: 85%
   ```

### If app not showing:
- [ ] Check app is subscribed to `/recognition_results` stream
- [ ] Verify FCM token is registered
- [ ] Check Firebase rules allow app to read `/recognition_results`

---

## 🔧 MANUAL TESTING

### Test Python recognition manually:

```python
import base64
from pathlib import Path
import sys
sys.path.insert(0, "Recog_Face/src")

from doorbell_processor import recognize_face_from_doorbell

# Load a test image
with open("test_image.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Test recognition
result = recognize_face_from_doorbell(image_base64)
print(result)

# Expected output:
# {
#   'recognized': True,
#   'name': 'John Doe',
#   'confidence': 0.85,
#   'distance': 0.28,
#   'authorized': True
# }
```

### Test Supabase connection:

```python
import os
from pathlib import Path
import sys
sys.path.insert(0, "Recog_Face/src")
from dotenv import load_dotenv

load_dotenv("Recog_Face/.env")
from supabase_client import fetch_active_visitors_with_embeddings

visitors = fetch_active_visitors_with_embeddings()
print(f"Found {len(visitors)} visitors")
for v in visitors:
    name = v.get("name")
    embeddings = v.get("face_embeddings", [])
    print(f"  {name}: {len(embeddings)} embeddings")
```

### Test Firebase connection:

```python
import os
from pathlib import Path
import firebase_admin
from firebase_admin import db, credentials

creds_path = "backend/config/firebase-service-account.json"
cred = credentials.Certificate(creds_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app'
})

# Test read
data = db.reference('/doorbell_events').limit_to_last(1).get()
print(f"Latest doorbell event: {data}")

# Test write
db.reference('/test').set({'status': 'ok'})
print("Firebase write test: OK")
```

---

## 📊 MONITORING DASHBOARD

### Keep these queries handy:

```sql
-- System Health Check
SELECT 
  'Visitors' as metric, COUNT(*) as count FROM visitors
UNION
SELECT 'Active Visitors', COUNT(*) FROM visitors WHERE status = 'active'
UNION
SELECT 'With Embeddings', COUNT(*) FROM visitors WHERE face_embeddings IS NOT NULL
UNION
SELECT 'With Images', COUNT(*) FROM visitors WHERE image_urls IS NOT NULL;

-- Recent Recognition Results (from Firebase monitoring)
-- In Firebase Console → Realtime Database → /recognition_results
-- Filter by recent timestamp (last 1 hour)

-- Doorbell Events Count
-- In Firebase Console → Realtime Database → /doorbell_events
-- Look at event count (should be growing if doorbell active)
```

---

## 🚨 COMMON ISSUES & FIXES

| Issue | Check | Fix |
|-------|-------|-----|
| "unclassified" results | `SELECT COUNT(*) WHERE face_embeddings IS NOT NULL` | Run `generate_embeddings.py` |
| face_recognition crashes | Python logs | Install dlib wheel |
| Supabase connection fails | .env file | Check credentials match project |
| API won't start | Error log | Check Firebase credentials path |
| Images not processed | Image URLs | Verify URLs are public & accessible |
| Low confidence scores | Doorbell image quality | Use clearer, frontal photos |
| Still "unknown" after setup | FACE_MATCH_THRESHOLD | Increase to 0.7-0.8 |

---

## ✅ FINAL VERIFICATION SCRIPT

Run this Python script to verify everything:

```bash
cd Recog_Face
python -c "
import os
import sys
sys.path.insert(0, 'src')
from dotenv import load_dotenv

load_dotenv('.env')

print('🔍 SYSTEM VERIFICATION')
print('=' * 50)

# 1. Check env
print('1️⃣  Environment:')
print(f'   SUPABASE_URL: {'✅' if os.getenv('SUPABASE_URL') else '❌'}')
print(f'   SUPABASE_KEY: {'✅' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else '❌'}')

# 2. Check imports
print('2️⃣  Dependencies:')
try:
    import tensorflow; print('   TensorFlow: ✅')
except: print('   TensorFlow: ❌')
try:
    import supabase; print('   Supabase: ✅')
except: print('   Supabase: ❌')
try:
    import firebase_admin; print('   Firebase: ✅')
except: print('   Firebase: ❌')

# 3. Check Supabase connection
print('3️⃣  Supabase:')
try:
    from supabase_client import fetch_active_visitors_with_embeddings
    v = fetch_active_visitors_with_embeddings()
    with_emb = sum(1 for x in v if x.get('face_embeddings'))
    print(f'   Visitors: {len(v)} total, {with_emb} with embeddings ✅')
except Exception as e: 
    print(f'   Supabase: ❌ {e}')

print('=' * 50)
"
```

---

## 🎯 SIGN-OFF

When you see:
- [ ] ✅ Supabase: X visitors with embeddings
- [ ] ✅ Firebase: Recent results show visitor names
- [ ] ✅ API: Running and listening
- [ ] ✅ App: Displays recognition results

**→ SYSTEM IS WORKING! 🎉**

Any issues? Run the manual tests above to pinpoint which component is failing.

# System Architecture & Data Flow: Complete Reference

## 🏗️ YOUR COMPLETE SYSTEM ARCHITECTURE

```
ESP32 DOORBELL
    ↓
    └─→ Sends base64 JPEG image
         └─→ Firebase /doorbell_events/{eventId}
              ├─ image: "data:image/jpeg;base64,/9j/4AAQSk..."
              └─ timestamp: "2025-12-29 08:40:35 PM"

PYTHON FACE RECOGNITION API (localhost:5000)
    ↓
    └─→ Listens to Firebase /doorbell_events in real-time
         └─→ When new image arrives:
              ├─ Download image
              ├─ Extract face encoding (128-dim vector)
              ├─ Query Supabase visitors with embeddings
              │   ├─ Get all active visitors
              │   └─ Get their face_embeddings
              ├─ Calculate distance between doorbell face and each visitor
              │   └─ face_recognition.face_distance(embeddings, doorbell_encoding)
              ├─ Find closest match
              ├─ If distance < threshold (0.6):
              │   └─ Recognized! ✅ Return visitor name
              └─ Else:
                  └─ Unknown ❌

RESULTS WRITTEN TO FIREBASE
    ↓
    └─→ /recognition_results/{resultId}
         ├─ recognized: true/false
         ├─ name: "John Doe" | "Unknown"
         ├─ confidence: 0.85
         ├─ distance: 0.32
         └─ authorized: true

FCM PUSH NOTIFICATION
    ↓
    └─→ Send to all registered mobile app users
         ├─ Title: "🔔 Doorbell: John Doe"
         ├─ Body: "Recognized & Authorized ✅"
         └─ Data: {recognition_result_id: "..."}

FLUTTER MOBILE APP
    ↓
    └─→ Receive FCM notification
         ├─ Listen to Firebase /recognition_results
         ├─ Display result in UI
         └─ Show "✅ John Doe detected at 2:45 PM"
```

---

## 📊 DATA FLOW IN DETAIL

### **Current Flow (WITH embeddings - what should happen):**

```
1. DOORBELL IMAGE ARRIVES (1587 events)
   Size: 4-5 KB (JPEG compressed)
   Format: Base64 encoded
   
2. PYTHON API PROCESSES
   doorbell_processor.py → recognize_face_from_doorbell()
   
3. STEP A: Extract face encoding from doorbell image
   Input: base64 image
   Process:
     • Decode base64 → PIL Image → numpy array
     • Load face_recognition library
     • face_locations = find faces in image
     • face_encodings = extract 128-dim vector for each face
     • Return encoding[0] (first face)
   Output: [0.234, -0.156, 0.891, ... 128 values total]
   
4. STEP B: Get embeddings from Supabase
   Query: SELECT * FROM visitors WHERE status='active'
   Result: {
     "name": "John Doe",
     "face_embeddings": [
       [0.245, -0.123, 0.876, ... 128 values],  // photo 1
       [0.256, -0.145, 0.891, ... 128 values],  // photo 2
       [0.233, -0.167, 0.899, ... 128 values]   // photo 3
     ]
   }
   
5. STEP C: Compare distances
   For each visitor's embeddings:
     distance = face_recognition.face_distance([embeddings], doorbell_encoding)
   Results:
     • John Doe photo1: distance = 0.32 → confidence = 0.68
     • John Doe photo2: distance = 0.28 → confidence = 0.72
     • Jane Smith photo1: distance = 0.95 → confidence = 0.05
   
6. STEP D: Find best match
   Best: John Doe, distance 0.28
   Threshold check: 0.28 < 0.60? YES ✅
   
7. WRITE RESULT TO FIREBASE
   Path: /recognition_results/image_988652_53
   Content: {
     "recognized": true,
     "name": "John Doe",
     "visitor_id": "abc-123",
     "confidence": 0.72,
     "distance": 0.28,
     "authorized": true,
     "timestamp": "2025-12-29T20:40:35Z"
   }
   
8. SEND FCM NOTIFICATION
   ├─ Title: "🔔 Doorbell: John Doe"
   ├─ Body: "Recognized at 8:40 PM"
   └─ Action: Open app → Show recognition result
   
9. APP RECEIVES & DISPLAYS
   ├─ Listen to /recognition_results stream
   ├─ Find matching result
   ├─ Display in UI:
   │   "✅ JOHN DOE recognized at 8:40 PM"
   │   "Confidence: 72%"
   │   "Status: Authorized - Can enter"
   └─ Show face crop from doorbell image
```

### **Previous Flow (WITHOUT embeddings - why it failed):**

```
1. DOORBELL IMAGE ARRIVES ✅
2. PYTHON API PROCESSES
   doorbell_processor.py → recognize_face_from_doorbell()
3. STEP A: Extract face encoding ✅
4. STEP B: Query Supabase
   ❌ SELECT * FROM visitors WHERE status='active'
   ❌ NO face_embeddings COLUMN EXISTS!
   ❌ Result: empty array
5. STEP C: Can't compare (no embeddings)
   ❌ No visitors to compare against
6. RETURN ERROR
   ❌ "No active visitors with embeddings"
7. WRITE TO FIREBASE
   ❌ {
      "recognized": false,
      "name": "Unknown", 
      "error": "No active visitors with embeddings"
     }
8. APP RECEIVES
   ❌ Shows "Unknown person"
   ❌ User frustrated
```

---

## 🗄️ DATABASE SCHEMA

### **BEFORE (Currently in your Supabase):**
```
visitors table:
┌─────────────────┬──────────────────────┐
│ id (uuid)       │ abc-123              │
├─────────────────┼──────────────────────┤
│ name (text)     │ John Doe             │
├─────────────────┼──────────────────────┤
│ status (text)   │ active               │
├─────────────────┼──────────────────────┤
│ image_urls      │ ["url1", "url2", ...] │
├─────────────────┼──────────────────────┤
│ metadata (jsonb)│ {...}                │
├─────────────────┼──────────────────────┤
│ created_at      │ 2025-01-15           │
└─────────────────┴──────────────────────┘
```

### **AFTER (What you need to add):**
```
visitors table:
┌─────────────────────────┬──────────────────────────┐
│ id (uuid)               │ abc-123                  │
├─────────────────────────┼──────────────────────────┤
│ name (text)             │ John Doe                 │
├─────────────────────────┼──────────────────────────┤
│ status (text)           │ active                   │
├─────────────────────────┼──────────────────────────┤
│ image_urls (jsonb)      │ ["url1", "url2", ...]   │
├─────────────────────────┼──────────────────────────┤
│ metadata (jsonb)        │ {...}                    │
├─────────────────────────┼──────────────────────────┤
│ face_embeddings (jsonb) │ [[0.24, -0.15, ...],    │ ← NEW!
│                         │  [0.25, -0.12, ...]]    │
├─────────────────────────┼──────────────────────────┤
│ created_at              │ 2025-01-15               │
├─────────────────────────┼──────────────────────────┤
│ updated_at              │ 2025-01-21               │
├─────────────────────────┼──────────────────────────┤
│ last_synced_for_face... │ 1737500435123            │
└─────────────────────────┴──────────────────────────┘
```

---

## 📋 CONFIGURATION REFERENCE

### **Recog_Face/.env**
```properties
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_VISITORS_TABLE=visitors

# Face Recognition Settings
FACE_MATCH_THRESHOLD=0.6           # Lower = stricter, Higher = lenient
MIN_CONFIDENCE_TO_UNLOCK=0.95      # Min score to open door
LOG_DETAILED_COMPARISONS=true

# Firebase
FIREBASE_DATABASE_URL=https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app
```

### **Key Thresholds Explained**

```
Distance Scale (0.0 = identical, 1.0 = completely different):

doorbell_face vs person1_photo1: distance = 0.32 (same person ✅)
doorbell_face vs person1_photo2: distance = 0.28 (same person ✅)
doorbell_face vs person2_photo1: distance = 0.95 (different person ❌)
doorbell_face vs stranger:        distance = 1.0 (completely different ❌)

Confidence = 1.0 - distance

With FACE_MATCH_THRESHOLD=0.6:
┌────────────────────┬──────────────┬────────────────┐
│ Distance           │ Confidence   │ Result         │
├────────────────────┼──────────────┼────────────────┤
│ 0.28               │ 0.72 (72%)   │ ✅ Recognized  │
│ 0.40               │ 0.60 (60%)   │ ✅ Recognized  │
│ 0.60               │ 0.40 (40%)   │ ❌ Unknown     │
│ 0.85               │ 0.15 (15%)   │ ❌ Unknown     │
└────────────────────┴──────────────┴────────────────┘

If doorbell person always "unknown" → increase threshold to 0.7 or 0.8
```

---

## 🔍 HOW TO DEBUG

### **Check Firebase Doorbell Events:**
```bash
# SSH into Firebase console or use Python:
from firebase_admin import db
events = db.reference('/doorbell_events').get()
print(f"Total events: {len(events)}")
print(f"Recent: {list(events.values())[-1]}")
```

### **Check Recognition Results:**
```bash
from firebase_admin import db
results = db.reference('/recognition_results').get()
print(f"Total results: {len(results)}")
print(f"Recognized: {sum(1 for r in results.values() if r.get('recognized'))}")
print(f"Unknown: {sum(1 for r in results.values() if not r.get('recognized'))}")
```

### **Check Supabase Embeddings:**
```sql
SELECT 
  name,
  jsonb_array_length(face_embeddings) as num_embeddings,
  jsonb_array_length(image_urls) as num_images
FROM visitors
WHERE status = 'active'
ORDER BY name;
```

---

## 🚀 QUICK COMMAND REFERENCE

```bash
# Start the system
cd Recog_Face && python api.py

# Generate embeddings
cd Recog_Face && python generate_embeddings.py

# Sync MongoDB to Supabase
cd Recog_Face && python sync_mongodb_to_supabase.py

# Full setup
cd Recog_Face && python setup_complete.py

# Check API status
curl http://localhost:5000/health

# Test recognition
curl -X POST http://localhost:5000/doorbell/recognize \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

---

## ✅ SUCCESS INDICATORS

When everything is working:

```
✅ Supabase has face_embeddings column
✅ Visitors table has active visitors with image_urls set
✅ generate_embeddings.py successfully creates embeddings
✅ Python API starts without errors
✅ Firebase /doorbell_events receives ESP32 images
✅ Recognition results show visitor names (not "unknown")
✅ Confidence scores are > 0.6 for recognized guests
✅ Flutter app receives and displays results
```

---

## 📞 SUPPORT

If something doesn't work:

1. Check logs: `Recog_Face/logs/face_recognition.log`
2. Run debug script: `python debug_supabase_query.py`
3. Verify Supabase schema: Check face_embeddings column exists
4. Test embeddings: `SELECT COUNT(*) FROM visitors WHERE face_embeddings IS NOT NULL`
5. Check Firebase: Console → Database → /recognition_results (look for recent errors)

All these tools are provided in `Recog_Face/` directory!

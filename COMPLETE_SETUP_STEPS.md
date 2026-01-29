# Complete Setup - Follow These Steps Exactly

## 🎯 YOUR GOAL
Make the doorbell recognize your 4 visitors by their faces instead of showing "unknown".

## ❌ WHY IT'S NOT WORKING NOW
- You have 1,587 doorbell images in Firebase ✅
- You have 1,535 recognition results ✅
- **But ALL show "unclassified"** ❌
- **Reason**: `face_embeddings` column is MISSING from Supabase

## ✅ THE FIX - 3 STEPS (20 minutes total)

---

## **STEP 1: Add face_embeddings Column** (2 minutes)

### In Supabase Console:

1. Go to: **https://app.supabase.com** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste:

```sql
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS face_embeddings jsonb DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_visitors_has_embeddings 
ON visitors(id) WHERE face_embeddings IS NOT NULL;
```

4. Click **Run** (keyboard shortcut: `Ctrl+Enter`)
5. ✅ Done - column is added

### Verify it worked:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'visitors' 
ORDER BY ordinal_position;
```
You should see `face_embeddings` in the list.

---

## **STEP 2: Upload Images & Set URLs** (5-10 minutes)

### Your 4 Images - Where to Put Them?

You mentioned you have 4 images. They need to be:
1. Uploaded to cloud storage (Firebase Storage, AWS S3, or similar)
2. Their public URLs added to Supabase

### Check current state:
```sql
SELECT name, image_urls FROM visitors LIMIT 5;
```

If `image_urls` is NULL or empty → **You need to add URLs**

### If using Firebase Storage:
```sql
-- Example of adding image URLs to visitors
UPDATE visitors SET 
  image_urls = '["https://storage.googleapis.com/smartbell.../photo1.jpg", "https://storage.googleapis.com/smartbell.../photo2.jpg"]'::jsonb
WHERE name = 'John Doe';
```

### If using Supabase Storage:
- Upload images via Supabase console
- Get public URL for each image
- Add to `image_urls` column

---

## **STEP 3: Generate Embeddings** (5-10 minutes)

Once images are uploaded and URLs are in Supabase:

### Run embedding generator:
```bash
cd C:\Users\abdul\Documents\FYP\Recog_Face
C:\Users\abdul\Documents\FYP\.venv\Scripts\python.exe generate_embeddings.py
```

### Expected output:
```
=============================
Processing: John Doe
  [1/4] Downloading: https://...
    ✅ Embedding extracted (128 dimensions)
  [2/4] Downloading: https://...
    ✅ Embedding extracted (128 dimensions)
  [3/4] Downloading: https://...
    ✅ Embedding extracted (128 dimensions)
  [4/4] Downloading: https://...
    ✅ Embedding extracted (128 dimensions)
  ✅ Successfully stored 4 embedding(s)
=============================

✅ Successfully processed: 1 visitor(s)
✅ Total visitors with embeddings: 1
```

### Verify embeddings created:
```sql
SELECT name, jsonb_array_length(face_embeddings) as num_embeddings
FROM visitors
WHERE face_embeddings IS NOT NULL;
```

You should see your visitor(s) with embeddings count.

---

## **STEP 4: Test It Works** (2 minutes)

### Start the API:
```bash
cd C:\Users\abdul\Documents\FYP\Recog_Face
C:\Users\abdul\Documents\FYP\.venv\Scripts\python.exe api.py
```

You should see:
```
[SYSTEM] ✓✓✓ System ready! Face recognition active ✓✓✓
[DOORBELL] 👀 Listening to Firebase /doorbell_events...
```

### Check Recent Recognition Results:

Go to: **Firebase Console** → **Realtime Database** → `/recognition_results`

**Before (❌ Not working):**
```
image_998652_53: { name: "unclassified", confidence: 0 }
image_999641_40: { name: "unclassified", confidence: 0 }
```

**After (✅ Working):**
```
image_998652_53: { name: "John Doe", confidence: 0.72, authorized: true }
image_999641_40: { name: "Jane Smith", confidence: 0.85, authorized: true }
```

---

## ⚠️ TROUBLESHOOTING

### Problem: "No active visitors with embeddings"
**Cause**: Embeddings not generated yet  
**Solution**: Run Step 3 again - `generate_embeddings.py`

### Problem: "No faces detected in image"
**Cause**: Image quality too low or doesn't contain clear face  
**Solution**: Use clearer, frontal face photos

### Problem: Still shows "unclassified" after setup
**Solution**: 
1. Check: `SELECT COUNT(*) FROM visitors WHERE face_embeddings IS NOT NULL;`
   - If 0: embeddings didn't generate
   - If >0: Check doorbell image quality
2. Check threshold: Too strict?
   - Edit `Recog_Face/.env`: change `FACE_MATCH_THRESHOLD=0.6` to `0.7` or `0.8`

### Problem: face_recognition module not found
**Solution**: 
```bash
pip install face_recognition
# If fails, you may need dlib wheel (Windows limitation)
# See: Recog_Face/INSTALLATION_GUIDE.md
```

---

## 🔄 COMPLETE AUTOMATION (Optional)

If you want everything automated:

```bash
cd C:\Users\abdul\Documents\FYP\Recog_Face

# Make sure .env has Supabase credentials
# Then run:
C:\Users\abdul\Documents\FYP\.venv\Scripts\python.exe setup_complete.py
```

This will:
1. ✅ Verify Supabase connection
2. ✅ Sync MongoDB visitors to Supabase (if MONGODB_URI set)
3. ✅ Generate embeddings from images
4. ✅ Show verification results

---

## 📋 CHECKLIST - Verify Each Step

- [ ] **Step 1 Done**: SQL column added to Supabase
  ```sql
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_name = 'visitors' AND column_name = 'face_embeddings';
  -- Should return: 1
  ```

- [ ] **Step 2 Done**: Image URLs in Supabase
  ```sql
  SELECT COUNT(*) FROM visitors WHERE image_urls IS NOT NULL;
  -- Should return: 1 or more
  ```

- [ ] **Step 3 Done**: Embeddings generated
  ```sql
  SELECT COUNT(*) FROM visitors WHERE face_embeddings IS NOT NULL;
  -- Should return: 1 or more
  ```

- [ ] **Step 4 Done**: API running
  ```bash
  curl http://localhost:5000/health
  -- Should return: 200 OK
  ```

- [ ] **Results showing names** (not "unclassified")
  Check Firebase `/recognition_results` in console

---

## 📞 HELP RESOURCES

Created for you in project root:

- `QUICK_START.md` - Quick reference
- `EMBEDDINGS_SETUP_GUIDE.md` - Detailed guide
- `SYSTEM_ARCHITECTURE.md` - How it all works
- `Recog_Face/generate_embeddings.py` - Embedding generator
- `Recog_Face/sync_mongodb_to_supabase.py` - Sync script
- `Recog_Face/setup_complete.py` - Automated setup

---

## 🎉 FINAL RESULT

After completing all steps:

```
┌─────────────────────────────────────────────┐
│  ESP32 takes doorbell photo                 │
│           ↓                                  │
│  Stored in Firebase /doorbell_events        │
│           ↓                                  │
│  Python API recognizes face                 │
│           ↓                                  │
│  Writes to /recognition_results:            │
│  {                                          │
│    name: "John Doe",                        │
│    confidence: 0.85,                        │
│    authorized: true                         │
│  }                                          │
│           ↓                                  │
│  FCM notification sent                      │
│           ↓                                  │
│  Flutter app shows:                         │
│  ✅ JOHN DOE recognized at 2:45 PM         │
└─────────────────────────────────────────────┘
```

**Setup time: ~20 minutes**  
**System status: 100% working ✅**

Let's go! 🚀

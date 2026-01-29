# Complete Setup Guide: Add Face Embeddings to Supabase

## Problem
Your Supabase `visitors` table is missing the `face_embeddings` column. The doorbell recognition system needs this to compare ESP32 images against stored visitor face encodings.

## Solution - 4 Steps

### **STEP 1: Add the face_embeddings Column to Supabase**

Go to **Supabase Console** → **SQL Editor** → Run this:

```sql
-- Add face_embeddings column
ALTER TABLE visitors 
ADD COLUMN face_embeddings jsonb DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX idx_visitors_has_embeddings 
ON visitors(id) 
WHERE face_embeddings IS NOT NULL;

-- Verify it was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'visitors' ORDER BY ordinal_position;
```

Expected result: You should see new `face_embeddings` column of type `jsonb`.

---

### **STEP 2: Populate Initial Visitor Data (If needed)**

Your system has visitors in **TWO places**:
- ✅ **MongoDB** (backend/models/Visitor.js) - used by admin panel
- ❌ **Supabase** (visitors table) - used by face recognition

You have 4 images stored. The question is: **Where are they?**

**Option A: Images are in MongoDB**
- They need to be uploaded to cloud storage (Firebase/S3) to get URLs
- Then add those URLs to Supabase `image_urls` column

**Option B: Images are already in Supabase**
- Check if `image_urls` column has the URLs
- Run query:
```sql
SELECT name, image_urls FROM visitors LIMIT 5;
```

---

### **STEP 3: Generate Embeddings from Images**

Once `image_urls` are in Supabase, run the Python script:

```bash
cd Recog_Face
python generate_embeddings.py
```

**What it does:**
1. Fetches all visitors with `image_urls`
2. Downloads each image
3. Extracts face encoding (128-dim vector)
4. Stores embedding in `face_embeddings` column

**Expected output:**
```
Processing: John Doe (abc-123)
  [1/4] Downloading: https://...image1.jpg
    ✅ Embedding extracted (128 dimensions)
  [2/4] Downloading: https://...image2.jpg
    ✅ Embedding extracted (128 dimensions)
  ...
✅ Successfully stored 4 embedding(s)
```

---

### **STEP 4: Test End-to-End**

1. **Start the API:**
   ```bash
   cd Recog_Face
   python api.py
   ```

2. **Send a doorbell image via Flask:**
   ```bash
   curl -X POST http://localhost:5000/doorbell/recognize \
     -H "Content-Type: application/json" \
     -d '{"image": "data:image/jpeg;base64,YOUR_BASE64_IMAGE"}'
   ```

3. **Check Firebase /recognition_results** - should now show visitor names instead of "unknown"!

---

## Troubleshooting

### ❌ "No embeddings generated"
- **Cause**: No faces detected in images
- **Fix**: Use clearer, frontal face photos

### ❌ "Images not found" 
- **Cause**: `image_urls` column is empty or NULL
- **Fix**: Upload images and get their URLs first

### ❌ face_recognition module not found
- **Cause**: dlib not installed (Windows issue)
- **Fix**: 
  ```bash
  pip install face_recognition
  # If fails, download prebuilt wheel from https://github.com/ageitgey/face_recognition/issues/175
  ```

---

## Architecture Overview

```
ESP32 Doorbell → Firebase /doorbell_events → Python API
                                                ↓
                                    Extract base64 image
                                                ↓
                                    Generate face encoding
                                                ↓
                        Query Supabase visitors.face_embeddings
                                                ↓
                        Compare distances (face_recognition)
                                                ↓
                Write result to Firebase /recognition_results
                                                ↓
                    FCM notification → Flutter app
```

---

## Files Reference

- **SQL Migration**: `supabase_migrations/001_add_face_embeddings.sql`
- **Embedding Generator**: `Recog_Face/generate_embeddings.py`
- **Doorbell Processor**: `Recog_Face/src/doorbell_processor.py`
- **Config**: `Recog_Face/.env`

---

## Next Steps

1. ✅ Run SQL migration in Supabase
2. ✅ Upload visitor images to cloud storage (if not already done)
3. ✅ Add image URLs to Supabase `image_urls` column
4. ✅ Run `generate_embeddings.py`
5. ✅ Test with real doorbell image

Questions? Check the logs:
- API logs: `Recog_Face/logs/face_recognition.log`
- Firebase: Console → Database → /recognition_results
- Supabase: Data Inspector → visitors table

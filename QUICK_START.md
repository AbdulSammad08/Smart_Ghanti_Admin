# 🚀 QUICK START: Make Your Doorbell Recognition Work

Your system has been sending "unclassified" because the `face_embeddings` column doesn't exist in Supabase. This guide will fix it in **5 minutes**.

## ✅ WHAT YOU NEED TO DO

### **STEP 1: Add face_embeddings Column to Supabase (2 minutes)**

1. Go to: https://app.supabase.com/
2. Select your project → **SQL Editor**
3. Click **New Query**
4. Paste this:

```sql
-- Add the missing face_embeddings column
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS face_embeddings jsonb DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_visitors_has_embeddings 
ON visitors(id) WHERE face_embeddings IS NOT NULL;

-- Verify it worked
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'visitors' 
ORDER BY ordinal_position;
```

5. Click **Run** (or Ctrl+Enter)
6. You should see the new `face_embeddings` column in the output ✅

---

### **STEP 2: Upload Visitor Images & Get URLs (depends on your setup)**

Your "4 images" - where are they currently?

**Option A: In MongoDB (backend)**
- Need to upload to Firebase Cloud Storage or similar
- Get public URLs
- Add those URLs to Supabase

**Option B: Already in cloud storage**
- Just add their URLs to Supabase `image_urls` column

**Option C: Unsure**
- Check your admin panel where you uploaded them
- Find the URLs or storage location

---

### **STEP 3: Generate Embeddings from Images (2 minutes)**

Once your images are accessible as URLs in Supabase `image_urls` column:

```bash
cd Recog_Face
python generate_embeddings.py
```

**What this does:**
- Downloads all visitor images
- Extracts 128-dimensional face encodings
- Stores them in `face_embeddings` column
- System is now ready! ✅

---

### **STEP 4: Test (1 minute)**

1. **Start the API:**
   ```bash
   cd Recog_Face
   python api.py
   ```

2. **Take a doorbell image** (or use existing ESP32 image from Firebase)

3. **Check Firebase console** → `/recognition_results`
   - Should now show visitor names instead of "unclassified"
   - Confidence score above 0

---

## 🎯 THE REASON IT WASN'T WORKING

**Before:** 
```
doorbell_processor.py queries Supabase for face_embeddings
→ Column doesn't exist 
→ Returns empty array 
→ No comparisons to make 
→ Returns "unknown"
```

**After:**
```
doorbell_processor.py queries Supabase for face_embeddings
→ Column exists with embeddings 
→ Compares doorbell image against all visitors 
→ Finds match 
→ Returns visitor name ✅
```

---

## 📊 YOUR CURRENT STATE

- ✅ Firebase doorbell events working (1587 events recorded)
- ✅ Recognition results being written (1535 results)
- ❌ Results showing "unclassified" because embeddings missing
- ✅ Python system ready to compare faces (just needs embeddings)

---

## 🔍 VERIFICATION

After each step, verify:

```sql
-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'visitors';

-- Check image URLs exist
SELECT name, jsonb_array_length(image_urls) as num_images 
FROM visitors;

-- Check embeddings were generated
SELECT name, jsonb_array_length(face_embeddings) as num_embeddings 
FROM visitors 
WHERE face_embeddings IS NOT NULL;
```

---

## ❓ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| SQL column not found after adding | Refresh page in Supabase console |
| generate_embeddings.py fails | Check .env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY |
| Still showing "unclassified" | Run: `SELECT COUNT(*) FROM visitors WHERE face_embeddings IS NOT NULL;` If 0, embeddings didn't generate |
| Faces not recognized (all "unknown") | Threshold might be too strict. Edit `Recog_Face/.env`: `FACE_MATCH_THRESHOLD=0.7` |

---

## 📝 FILES CREATED FOR YOU

- `EMBEDDINGS_SETUP_GUIDE.md` - Full documentation
- `Recog_Face/generate_embeddings.py` - Generate embeddings from images
- `Recog_Face/sync_mongodb_to_supabase.py` - Sync MongoDB visitors to Supabase
- `Recog_Face/setup_complete.py` - One-command setup (all 3 steps)

---

## ✅ DONE!

Once embeddings are generated, your system will:
1. Receive ESP32 doorbell image
2. Query Supabase for all visitor embeddings
3. Compare face distances
4. Write recognized name to Firebase
5. Send FCM notification to app
6. App shows "John Doe recognized! ✅"

**Time to setup: ~5 minutes**
**Time to working system: ~20 minutes** (including image uploads)

Go! 🚀

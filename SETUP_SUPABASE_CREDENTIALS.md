# ⚠️ SETUP REQUIRED: Add Your Supabase Credentials

Before running the embedding generator, you need to add your Supabase credentials to `.env`.

## 🔑 How to Get Your Credentials

### Step 1: Go to Supabase Console
1. Visit: https://app.supabase.com
2. Select your project: **smartbell-61451** (or your project name)

### Step 2: Get SUPABASE_URL
1. Go to **Settings** → **API**
2. Find **Project URL**
3. Copy it (looks like: `https://your-project.supabase.co`)

### Step 3: Get SUPABASE_SERVICE_ROLE_KEY
1. Go to **Settings** → **API**
2. Find **Project API keys** section
3. Copy the **`service_role`** key (NOT the `anon` key!)
4. Key looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ✏️ Update Your `.env` File

Edit: `Recog_Face/.env`

Replace:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

With your actual values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ IMPORTANT SECURITY NOTE

**NEVER commit `.env` file to Git!**

- The `.gitignore` should already exclude it
- These are sensitive credentials
- Keep them private and secure

---

## ✅ Verify Setup

After updating `.env`, test the connection:

```bash
cd Recog_Face
python -c "
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('.env')
url = os.getenv('SUPABASE_URL', '').strip()
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip()

print(f'SUPABASE_URL: {'✅ SET' if url else '❌ NOT SET'}')
print(f'SUPABASE_KEY: {'✅ SET (hidden)' if key else '❌ NOT SET'}')

if url and key:
    try:
        from supabase import create_client
        client = create_client(url, key)
        print('✅ Connection test: SUCCESS')
    except Exception as e:
        print(f'❌ Connection test: FAILED - {e}')
"
```

---

## 🚀 Once Credentials Are Set

Run the embedding generator:

```bash
python generate_embeddings_deepface.py
```

This will:
1. Connect to Supabase
2. Fetch your 3 visitors
3. Download their images
4. Extract face embeddings
5. Store in `face_embeddings` column
6. Done! ✅

---

## 📋 Checklist

- [ ] Got SUPABASE_URL from Supabase console
- [ ] Got SUPABASE_SERVICE_ROLE_KEY (not anon key!)
- [ ] Updated `.env` file with both values
- [ ] Ran verification test
- [ ] Got "✅ Connection test: SUCCESS"
- [ ] Ready to run embedding generator

Need help? Check the Supabase docs: https://supabase.com/docs/guides/api

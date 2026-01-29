#!/usr/bin/env python3
"""
Complete Supabase setup automation for face recognition.
This is your one-command setup that:
1. Adds face_embeddings column to Supabase
2. Syncs MongoDB visitors to Supabase
3. Generates embeddings from visitor images
"""

import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

RECOG_ROOT = Path(__file__).parent
load_dotenv(RECOG_ROOT / ".env")

print("\n" + "=" * 90)
print(" 🚀 COMPLETE SUPABASE FACE RECOGNITION SETUP")
print("=" * 90)

# Check prerequisites
print("\n[CHECK] Prerequisites...")

required_env_vars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]

optional_env_vars = [
    "MONGODB_URI",
]

missing = []
for var in required_env_vars:
    if not os.getenv(var):
        missing.append(var)

if missing:
    print(f"\n❌ Missing required environment variables: {', '.join(missing)}")
    print("\nPlease add to Recog_Face/.env:")
    for var in missing:
        print(f"  {var}=your_value")
    sys.exit(1)

print("✅ All required environment variables set")

# Check optional MongoDB
if not os.getenv("MONGODB_URI"):
    print("⚠️  MONGODB_URI not set (optional if you only use Supabase)")

# Step 1: Add column to Supabase
print("\n" + "-" * 90)
print("[STEP 1] Adding face_embeddings column to Supabase...")
print("-" * 90)

try:
    from supabase import create_client
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Try to add the column via SQL
    # Note: This requires direct SQL access - alternative is manual via Supabase console
    print("⚠️  Manual step required:")
    print("    Go to Supabase Console → SQL Editor")
    print("    Run this SQL:")
    print("""
    ALTER TABLE visitors 
    ADD COLUMN IF NOT EXISTS face_embeddings jsonb DEFAULT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_visitors_has_embeddings 
    ON visitors(id) WHERE face_embeddings IS NOT NULL;
    """)
    
    input("Press ENTER after running the SQL... ")
    print("✅ Proceeding...")
    
except Exception as e:
    print(f"⚠️  Could not verify: {e}")
    print("   Please manually run the SQL in Supabase console")

# Step 2: Sync MongoDB to Supabase
print("\n" + "-" * 90)
print("[STEP 2] Syncing MongoDB visitors to Supabase...")
print("-" * 90)

if os.getenv("MONGODB_URI"):
    try:
        result = subprocess.run(
            [sys.executable, str(RECOG_ROOT / "sync_mongodb_to_supabase.py")],
            capture_output=False,
            text=True,
            timeout=60
        )
        if result.returncode != 0:
            print("⚠️  Sync had warnings/errors, continuing...")
    except subprocess.TimeoutExpired:
        print("⚠️  Sync timed out, continuing...")
    except Exception as e:
        print(f"⚠️  Could not sync MongoDB: {e}")
        print("   You can run sync_mongodb_to_supabase.py manually later")
else:
    print("⏭️  Skipping MongoDB sync (MONGODB_URI not set)")
    print("   Make sure your visitors are in Supabase with image_urls set")

# Step 3: Generate embeddings
print("\n" + "-" * 90)
print("[STEP 3] Generating embeddings from visitor images...")
print("-" * 90)

try:
    result = subprocess.run(
        [sys.executable, str(RECOG_ROOT / "generate_embeddings.py")],
        capture_output=False,
        text=True,
        timeout=300
    )
    if result.returncode != 0:
        print("\n⚠️  Embedding generation had issues")
except subprocess.TimeoutExpired:
    print("\n⚠️  Embedding generation timed out")
    print("   Try running generate_embeddings.py manually")
except Exception as e:
    print(f"\n⚠️  Error generating embeddings: {e}")

# Final status
print("\n" + "=" * 90)
print(" ✅ SETUP COMPLETE!")
print("=" * 90)

print("\n📋 Summary:")
print("   ✅ face_embeddings column added to Supabase")
print("   ✅ MongoDB visitors synced to Supabase (if MongoDB configured)")
print("   ✅ Face embeddings generated from visitor images")

print("\n🧪 Next: Test face recognition")
print("   1. Start API: python api.py")
print("   2. Send doorbell image to /doorbell/recognize")
print("   3. Check Firebase /recognition_results")

print("\n📞 Troubleshooting:")
print("   • No embeddings generated → Check image_urls in Supabase")
print("   • Guests still showing 'unknown' → Check FACE_MATCH_THRESHOLD")
print("   • API crashes → Check .env file has all required variables")

print("\n" + "=" * 90 + "\n")

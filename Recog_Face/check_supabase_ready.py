#!/usr/bin/env python3
"""
Simple check: Can we load Supabase embeddings?
"""
import os
import sys

print("\n" + "="*70)
print("QUICK SUPABASE CONNECTION TEST")
print("="*70)

# Check .env
print("\n[1/4] Checking .env file...")
env_path = os.path.join(os.path.dirname(__file__), '.env')
if not os.path.exists(env_path):
    print("❌ .env file not found")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or ""

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not set in .env")
    print("\nRequired variables:")
    print("  SUPABASE_URL=your_url")
    print("  SUPABASE_SERVICE_ROLE_KEY=your_key")
    sys.exit(1)

print(f"✅ Found credentials")
print(f"   URL: {SUPABASE_URL[:40]}...")

# Check connection
print("\n[2/4] Testing Supabase connection...")
try:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# Check for visitors
print("\n[3/4] Fetching visitors...")
try:
    response = client.table("visitors").select("id,name,face_embeddings,status").execute()
    visitors = response.data or []
    print(f"✅ Found {len(visitors)} total visitors")
except Exception as e:
    print(f"❌ Failed to fetch visitors: {e}")
    sys.exit(1)

# Check embeddings
print("\n[4/4] Checking embeddings...")
visitors_with_embeddings = [
    v for v in visitors 
    if v.get('face_embeddings') and len(v.get('face_embeddings', [])) > 0
]

if len(visitors_with_embeddings) == 0:
    print("❌ No visitors with embeddings found!")
    print("\nYou need to generate embeddings:")
    print("  cd C:\\Users\\abdul\\Documents\\FYP\\Recog_Face")
    print("  .\\.venv_recog\\Scripts\\python.exe generate_embeddings_tf.py")
    sys.exit(1)

print(f"✅ {len(visitors_with_embeddings)} visitor(s) with embeddings:\n")
for v in visitors_with_embeddings:
    name = v.get('name', 'Unknown')
    num_emb = len(v.get('face_embeddings', []))
    print(f"   • {name}: {num_emb} embedding(s)")

print("\n" + "="*70)
print("✅ SUCCESS! Supabase embeddings are ready")
print("="*70)
print("\nYour system is configured correctly!")
print("Start the API with: python api.py")
print("\n")

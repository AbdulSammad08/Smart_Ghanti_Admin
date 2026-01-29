"""
Debug script to check if Supabase embeddings exist and are correctly formatted.
Run this to diagnose why face recognition is failing.
"""

import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or ""

print("=" * 80)
print("SUPABASE EMBEDDINGS DIAGNOSTIC CHECK")
print("=" * 80)

# Step 1: Check credentials
print("\n[STEP 1] Checking Supabase credentials...")
if not SUPABASE_URL:
    print("❌ SUPABASE_URL not set. Please set environment variable.")
    sys.exit(1)
if not SUPABASE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY not set. Please set environment variable.")
    sys.exit(1)

print(f"✅ SUPABASE_URL: {SUPABASE_URL}")
print(f"✅ SUPABASE_SERVICE_ROLE_KEY: {'*' * 20}[HIDDEN]")

# Step 2: Connect to Supabase
print("\n[STEP 2] Connecting to Supabase...")
try:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

# Step 3: Fetch all visitors (active and inactive)
print("\n[STEP 3] Fetching all visitors...")
try:
    response = client.table("visitors").select("id,name,status,face_embeddings").execute()
    visitors = response.data or []
    print(f"✅ Found {len(visitors)} visitors total")
except Exception as e:
    print(f"❌ Failed to fetch visitors: {e}")
    sys.exit(1)

# Step 4: Analyze embeddings
print("\n[STEP 4] Analyzing embeddings per visitor...")
print("-" * 80)

visitors_with_embeddings = 0
visitors_without_embeddings = 0
embedding_issues = []

for visitor in visitors:
    visitor_id = visitor.get("id")
    name = visitor.get("name", "Unknown")
    status = visitor.get("status", "unknown")
    embeddings = visitor.get("face_embeddings")
    
    # Parse embeddings if string
    if isinstance(embeddings, str):
        try:
            embeddings = json.loads(embeddings)
        except:
            embeddings = []
    
    if embeddings and len(embeddings) > 0:
        visitors_with_embeddings += 1
        num_embeddings = len(embeddings)
        
        # Check embedding format
        try:
            first_emb = embeddings[0]
            if isinstance(first_emb, (list, tuple)):
                emb_dim = len(first_emb)
                print(f"✅ {name} (ID: {visitor_id}) | Status: {status}")
                print(f"   ├─ # of embeddings: {num_embeddings}")
                print(f"   └─ Embedding dimension: {emb_dim} (expected: 128)")
            else:
                print(f"⚠️  {name} (ID: {visitor_id}) | Status: {status}")
                print(f"   └─ Embedding format error: not a list/array")
                embedding_issues.append((name, "invalid format"))
        except Exception as e:
            print(f"⚠️  {name} (ID: {visitor_id}) | Status: {status}")
            print(f"   └─ Error parsing embedding: {e}")
            embedding_issues.append((name, str(e)))
    else:
        visitors_without_embeddings += 1
        print(f"❌ {name} (ID: {visitor_id}) | Status: {status}")
        print(f"   └─ NO EMBEDDINGS FOUND")

# Step 5: Active visitors check
print("\n[STEP 5] Checking ACTIVE visitors only...")
print("-" * 80)

try:
    response = client.table("visitors").select("id,name,status,face_embeddings").eq("status", "active").execute()
    active_visitors = response.data or []
    active_with_embeddings = sum(1 for v in active_visitors if v.get("face_embeddings"))
    
    print(f"✅ Found {len(active_visitors)} active visitors")
    print(f"   ├─ Active with embeddings: {active_with_embeddings}")
    print(f"   └─ Active without embeddings: {len(active_visitors) - active_with_embeddings}")
    
    if len(active_visitors) > 0:
        print("\n   Active visitors:")
        for v in active_visitors:
            name = v.get("name", "Unknown")
            embs = v.get("face_embeddings")
            if isinstance(embs, str):
                try:
                    embs = json.loads(embs)
                except:
                    embs = []
            num_embs = len(embs) if embs else 0
            print(f"   • {name}: {num_embs} embeddings")
except Exception as e:
    print(f"❌ Failed to fetch active visitors: {e}")

# Step 6: Summary & Recommendations
print("\n[STEP 6] SUMMARY & DIAGNOSIS")
print("=" * 80)

print(f"\nTotal visitors: {len(visitors)}")
print(f"With embeddings: {visitors_with_embeddings}")
print(f"Without embeddings: {visitors_without_embeddings}")

if visitors_with_embeddings == 0:
    print("\n❌ CRITICAL ISSUE: NO EMBEDDINGS FOUND IN SUPABASE")
    print("\nPossible causes:")
    print("1. Embeddings are NOT being generated when visitor photos are uploaded")
    print("2. Admin panel is not calling face_recognition to create embeddings")
    print("3. Photos are stored but embeddings column is empty/NULL")
    print("\nSOLUTION:")
    print("• Check if admin panel has code to generate embeddings on upload")
    print("• Manually run build_embeddings.py for each visitor with photos")
    print("• Or implement embedding generation in admin upload endpoint")
elif embedding_issues:
    print(f"\n⚠️  WARNING: {len(embedding_issues)} visitor(s) have embedding format issues")
    for name, issue in embedding_issues:
        print(f"   • {name}: {issue}")
else:
    print("\n✅ Embeddings appear to be correctly stored!")
    print("   If recognition still fails, check:")
    print("   1. Doorbell image quality (needs to have a clear face)")
    print("   2. FACE_MATCH_THRESHOLD setting (currently 0.6)")
    print("   3. Face_recognition library loaded (test with dlib)")

print("\n" + "=" * 80)

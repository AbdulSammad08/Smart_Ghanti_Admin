#!/usr/bin/env python3
"""
Quick check: Does Supabase have any visitors with embeddings?
This is the ROOT CAUSE of why recognition shows "unknown".
"""

import os
import sys
from pathlib import Path

RECOG_ROOT = Path(__file__).parent
sys.path.insert(0, str(RECOG_ROOT / "src"))

from dotenv import load_dotenv
load_dotenv(RECOG_ROOT / ".env")

# Check environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or "").strip()

print("\n" + "=" * 80)
print("QUICK SUPABASE EMBEDDINGS CHECK")
print("=" * 80)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ SUPABASE CREDENTIALS NOT SET")
    print("\nPlease add to Recog_Face/.env:")
    print("  SUPABASE_URL=your_supabase_url")
    print("  SUPABASE_SERVICE_ROLE_KEY=your_key")
    print("\nYou can get these from your Supabase project settings")
    sys.exit(1)

print(f"\n✅ Supabase URL configured: {SUPABASE_URL[:50]}...")

try:
    from supabase import create_client
    
    print("Connecting to Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Query all visitors
    print("Querying 'visitors' table...")
    response = client.table("visitors").select("id,name,status,face_embeddings").execute()
    
    all_visitors = response.data or []
    print(f"\n✅ Total visitors in database: {len(all_visitors)}")
    
    # Count by status
    active_count = sum(1 for v in all_visitors if v.get("status") == "active")
    with_embeddings = sum(1 for v in all_visitors if v.get("face_embeddings"))
    active_with_embeddings = sum(1 for v in all_visitors if v.get("status") == "active" and v.get("face_embeddings"))
    
    print(f"  ├─ Active visitors: {active_count}")
    print(f"  ├─ With embeddings: {with_embeddings}")
    print(f"  └─ Active WITH embeddings: {active_with_embeddings}")
    
    if active_with_embeddings == 0:
        print("\n" + "=" * 80)
        print("🔴 CRITICAL ISSUE FOUND!")
        print("=" * 80)
        print("\n❌ NO ACTIVE VISITORS WITH EMBEDDINGS IN SUPABASE")
        print("\nThis is WHY face recognition returns 'unknown' for all doorbell images!")
        print("\n📋 SOLUTION:")
        print("   1. Check if any visitors exist: ")
        if len(all_visitors) == 0:
            print("      → No visitors at all! Create visitors first")
        else:
            print(f"      → {len(all_visitors)} visitors exist")
            print("      • Check their 'status' field (should be 'active')")
            print("      • Check their 'face_embeddings' column (should not be NULL)")
        
        print("\n   2. If visitors exist but NO embeddings:")
        print("      • Does admin panel generate embeddings on photo upload?")
        print("      • Check: Does upload endpoint call face_recognition?")
        print("      • Manual fix: Run build_embeddings.py for each visitor")
        
        print("\n   3. Verify data directly in Supabase:")
        print("      • Go to SQL Editor in Supabase console")
        print("      • Run: SELECT name, status, face_embeddings FROM visitors LIMIT 10")
        print("      • Check the face_embeddings column content")
    
    else:
        print("\n" + "=" * 80)
        print("✅ GOOD NEWS!")
        print("=" * 80)
        print(f"\n✅ Found {active_with_embeddings} active visitors with embeddings")
        
        # Show details
        print("\nVisitor Embeddings Status:")
        for v in all_visitors:
            if v.get("status") == "active" and v.get("face_embeddings"):
                name = v.get("name", "Unknown")
                embeddings = v.get("face_embeddings")
                
                if isinstance(embeddings, str):
                    try:
                        import json
                        embeddings = json.loads(embeddings)
                    except:
                        embeddings = []
                
                num_embs = len(embeddings) if isinstance(embeddings, list) else 1
                print(f"  ✅ {name}: {num_embs} embedding(s)")
        
        print("\n🔍 If recognition still returns 'unknown':")
        print("   1. Doorbell image may not contain a clear face")
        print("   2. Face in doorbell image is too different from embeddings")
        print("   3. FACE_MATCH_THRESHOLD too strict (currently 0.6)")
        print("      • Try higher threshold: 0.7-0.8")
        print("      • Edit: Recog_Face/src/config.py or .env")
        print("   4. Check doorbell image quality/lighting")
    
    print("\n" + "=" * 80 + "\n")
    
except ImportError as e:
    print(f"\n❌ Missing dependency: {e}")
    print("   Run: pip install supabase python-dotenv")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

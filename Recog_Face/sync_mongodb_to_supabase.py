#!/usr/bin/env python3
"""
Sync MongoDB visitors to Supabase visitors table.
This bridges the two visitor stores so that:
1. Admin adds visitors in Node.js backend (MongoDB)
2. Visitors are synced to Supabase
3. Face recognition system queries Supabase
"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv

# Setup paths
REPO_ROOT = Path(__file__).parent
RECOG_ROOT = REPO_ROOT / "Recog_Face"
sys.path.insert(0, str(RECOG_ROOT / "src"))

load_dotenv(RECOG_ROOT / ".env")

print("\n" + "=" * 90)
print(" MONGODB ↔ SUPABASE VISITOR SYNCHRONIZATION")
print("=" * 90)

# ============= PHASE 1: Connect to MongoDB =============
print("\n[PHASE 1] Connecting to MongoDB...")

try:
    from pymongo import MongoClient
    
    # Get MongoDB connection string from env or use default
    MONGODB_URI = os.getenv("MONGODB_URI", "")
    if not MONGODB_URI:
        print("❌ MONGODB_URI not set in environment")
        print("   Set it in your .env or system environment")
        sys.exit(1)
    
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB")
    
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    print("   Make sure MONGODB_URI is set correctly")
    sys.exit(1)

# ============= PHASE 2: Connect to Supabase =============
print("\n[PHASE 2] Connecting to Supabase...")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not set")
    print("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

try:
    from supabase import create_client
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    sys.exit(1)

# ============= PHASE 3: Fetch MongoDB Visitors =============
print("\n[PHASE 3] Fetching visitors from MongoDB...")

try:
    db = client["smartbell"]  # Adjust database name if different
    visitors_collection = db["visitors"]
    
    mongodb_visitors = list(visitors_collection.find({}))
    print(f"✅ Found {len(mongodb_visitors)} visitors in MongoDB")
    
    if len(mongodb_visitors) == 0:
        print("⚠️  No visitors in MongoDB")
        sys.exit(0)
    
except Exception as e:
    print(f"❌ Error reading MongoDB: {e}")
    sys.exit(1)

# ============= PHASE 4: Sync to Supabase =============
print("\n[PHASE 4] Syncing visitors to Supabase...")
print("-" * 90)

synced = 0
updated = 0
failed = 0

for mongo_visitor in mongodb_visitors:
    try:
        # Build Supabase visitor record
        visitor_id = str(mongo_visitor.get("_id", ""))
        name = mongo_visitor.get("name", "Unknown")
        status = "active" if mongo_visitor.get("isAuthorized", False) else "inactive"
        
        # Build metadata
        metadata = {
            "email": mongo_visitor.get("email", ""),
            "phone": mongo_visitor.get("phone", ""),
            "notes": mongo_visitor.get("notes", ""),
            "addedBy": mongo_visitor.get("addedBy", ""),
            "isAuthorized": mongo_visitor.get("isAuthorized", False),
            "mongodb_id": visitor_id
        }
        
        # Prepare Supabase record
        supabase_visitor = {
            "id": visitor_id,
            "name": name,
            "status": status,
            "metadata": metadata,
            # Keep existing embeddings if they exist
            # Don't overwrite image_urls
        }
        
        # Check if visitor exists in Supabase
        response = supabase_client.table("visitors").select("id").eq("id", visitor_id).execute()
        
        if response.data and len(response.data) > 0:
            # Update existing
            supabase_client.table("visitors").update(supabase_visitor).eq("id", visitor_id).execute()
            print(f"🔄 Updated: {name} ({visitor_id})")
            updated += 1
        else:
            # Insert new
            supabase_client.table("visitors").insert(supabase_visitor).execute()
            print(f"✅ Synced: {name} ({visitor_id})")
            synced += 1
            
    except Exception as e:
        print(f"❌ Error syncing {mongo_visitor.get('name')}: {e}")
        failed += 1

# ============= PHASE 5: Summary =============
print("\n" + "=" * 90)
print("[PHASE 5] SUMMARY")
print("-" * 90)

print(f"\n✅ Synced: {synced} new visitor(s)")
print(f"🔄 Updated: {updated} visitor(s)")
print(f"❌ Failed: {failed} visitor(s)")

# Final verification
try:
    response = supabase_client.table("visitors").select("id,name,status").execute()
    supabase_visitors = response.data or []
    print(f"\n📊 Total visitors in Supabase: {len(supabase_visitors)}")
    
    active = sum(1 for v in supabase_visitors if v.get("status") == "active")
    with_embeddings = sum(
        1 for v in supabase_visitors 
        if v.get("face_embeddings")
    )
    
    print(f"   • Active: {active}")
    print(f"   • With embeddings: {with_embeddings}")
    
    if with_embeddings > 0:
        print(f"\n🎉 System ready for face recognition!")
    else:
        print(f"\n📝 Next step: Run generate_embeddings.py to create face embeddings")
        
except Exception as e:
    print(f"⚠️  Error in final verification: {e}")

print("\n" + "=" * 90 + "\n")

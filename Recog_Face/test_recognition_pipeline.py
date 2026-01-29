"""
Complete diagnostic test for doorbell face recognition pipeline.
Tests: Supabase connection → Embeddings fetch → Face encoding from image → Distance comparison
"""

import base64
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Setup paths
REPO_ROOT = Path(__file__).parent.parent
RECOG_ROOT = Path(__file__).parent
sys.path.insert(0, str(RECOG_ROOT / "src"))

load_dotenv(RECOG_ROOT / ".env")

print("\n" + "=" * 90)
print(" COMPLETE DOORBELL FACE RECOGNITION DIAGNOSTIC TEST")
print("=" * 90)

# ==================== PHASE 1: Check Configuration ====================
print("\n[PHASE 1] Checking Configuration...")
print("-" * 90)

from config import (
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_VISITORS_TABLE,
    FACE_MATCH_THRESHOLD, LOG_DETAILED_COMPARISONS
)

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ FATAL: Supabase credentials not set in .env")
    print("\nPlease add to Recog_Face/.env:")
    print("SUPABASE_URL=your_url")
    print("SUPABASE_SERVICE_ROLE_KEY=your_key")
    sys.exit(1)

print(f"✅ SUPABASE_URL: {SUPABASE_URL[:40]}...")
print(f"✅ SUPABASE_VISITORS_TABLE: {SUPABASE_VISITORS_TABLE}")
print(f"✅ FACE_MATCH_THRESHOLD: {FACE_MATCH_THRESHOLD}")
print(f"✅ LOG_DETAILED_COMPARISONS: {LOG_DETAILED_COMPARISONS}")

# ==================== PHASE 2: Test Supabase Connection ====================
print("\n[PHASE 2] Testing Supabase Connection...")
print("-" * 90)

try:
    from supabase_client import get_supabase_client, fetch_active_visitors_with_embeddings
    client = get_supabase_client()
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    sys.exit(1)

# ==================== PHASE 3: Fetch Visitors & Embeddings ====================
print("\n[PHASE 3] Fetching Visitors with Embeddings...")
print("-" * 90)

try:
    visitors = fetch_active_visitors_with_embeddings()
    print(f"✅ Found {len(visitors)} active visitors with embeddings")
    
    if len(visitors) == 0:
        print("\n⚠️  WARNING: No active visitors with embeddings found in Supabase!")
        print("\nPossible causes:")
        print("1. No visitors marked as 'active' in the database")
        print("2. Visitors exist but 'face_embeddings' column is empty/NULL")
        print("3. Wrong table name (expected: 'visitors')")
        print("\nTo debug:")
        print("  • Run: SELECT COUNT(*) FROM visitors WHERE status = 'active'")
        print("  • Run: SELECT name, status, face_embeddings FROM visitors LIMIT 5")
        print("  • Ensure admin panel generates embeddings when photos are uploaded")
        sys.exit(1)
    
    # Show visitor details
    print("\nVisitor Details:")
    total_embeddings = 0
    for visitor in visitors:
        name = visitor.get("name", "Unknown")
        visitor_id = visitor.get("id")
        embeddings = visitor.get("face_embeddings", [])
        num_embeddings = len(embeddings) if embeddings else 0
        total_embeddings += num_embeddings
        
        print(f"  • {name} (ID: {visitor_id}): {num_embeddings} embeddings")
        
        # Validate embedding format
        if embeddings and len(embeddings) > 0:
            try:
                emb_dim = len(embeddings[0])
                if emb_dim != 128:
                    print(f"    ⚠️  Embedding dimension is {emb_dim}, expected 128")
            except:
                print(f"    ⚠️  Embedding format error")
    
    print(f"\n✅ Total embeddings available: {total_embeddings}")
    
except Exception as e:
    print(f"❌ Failed to fetch visitors: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ==================== PHASE 4: Test Face Encoding ====================
print("\n[PHASE 4] Testing Face Encoding Pipeline...")
print("-" * 90)

try:
    from doorbell_processor import extract_face_encoding_from_base64
    import numpy as np
    
    # Try to find a test image
    test_images = list(Path(RECOG_ROOT).glob("dataset/*/test*.jpg")) + \
                  list(Path(RECOG_ROOT).glob("dataset/*/*.jpg"))[:3]
    
    if test_images:
        test_image_path = test_images[0]
        print(f"✅ Found test image: {test_image_path}")
        
        # Encode image to base64
        with open(test_image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()
        
        print(f"✅ Image encoded to base64 ({len(image_base64)} bytes)")
        
        # Try to extract face encoding
        try:
            encoding = extract_face_encoding_from_base64(image_base64)
            if encoding is not None:
                print(f"✅ Face encoding extracted successfully")
                print(f"   Encoding dimension: {len(encoding)}")
                print(f"   Encoding sample: {encoding[:5]}...")
            else:
                print(f"⚠️  No face detected in test image")
        except Exception as e:
            print(f"❌ Failed to extract face encoding: {e}")
            print("   This likely means face_recognition/dlib is not installed")
    else:
        print("⚠️  No test images found in dataset/")
        print("   Skipping face encoding test")
        
except ImportError as e:
    print(f"⚠️  face_recognition module not available: {e}")
    print("   This is expected if dlib is not installed on Windows")
    print("   The system will return 'dependency_missing' error for doorbell images")
except Exception as e:
    print(f"❌ Error in face encoding test: {e}")
    import traceback
    traceback.print_exc()

# ==================== PHASE 5: Full Pipeline Test ====================
print("\n[PHASE 5] Testing Full Recognition Pipeline...")
print("-" * 90)

try:
    from doorbell_processor import recognize_face_from_doorbell
    
    if test_images:
        with open(test_image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()
        
        print(f"Testing with: {test_image_path.name}")
        result = recognize_face_from_doorbell(image_base64)
        
        print(f"\nRecognition Result:")
        print(f"  ✓ Recognized: {result.get('recognized')}")
        print(f"  ✓ Name: {result.get('name')}")
        print(f"  ✓ Confidence: {result.get('confidence', 0):.4f}")
        print(f"  ✓ Distance: {result.get('distance', 'N/A')}")
        print(f"  ✓ Authorized: {result.get('authorized')}")
        
        if result.get("error"):
            print(f"  ✗ Error: {result.get('error')}")
        
        if result.get("comparisons"):
            print(f"\n  Comparison Details:")
            for comp in result.get("comparisons", []):
                print(f"    • {comp.get('visitor_name')}: distance={comp.get('min_distance'):.4f}, confidence={comp.get('confidence'):.4f}")
    else:
        print("⚠️  Skipping pipeline test (no test images)")
        
except Exception as e:
    print(f"❌ Pipeline test failed: {e}")
    import traceback
    traceback.print_exc()

# ==================== PHASE 6: Firebase Connection Test ====================
print("\n[PHASE 6] Testing Firebase Connection...")
print("-" * 90)

try:
    from firebase_sync import FirebaseSyncManager
    print("✅ Firebase sync manager importable")
    
    # Don't actually connect/listen, just check initialization
    print("✅ Firebase module ready")
    
except Exception as e:
    print(f"⚠️  Firebase module error: {e}")

# ==================== FINAL SUMMARY ====================
print("\n" + "=" * 90)
print(" DIAGNOSTIC SUMMARY")
print("=" * 90)

print("\n✅ System Status:")
if len(visitors) > 0 and total_embeddings > 0:
    print("   • Supabase is connected and has visitor embeddings")
    print("   • Recognition should work IF dlib is installed")
    print("   • Check doorbell image quality if recognition still fails")
else:
    print("   • ❌ PROBLEM: No embeddings in Supabase")
    print("   • This is why face recognition returns 'unknown'")

print("\n📋 Next Steps:")
print("   1. If 'No active visitors': Manually set visitor status to 'active' in Supabase")
print("   2. If 'No embeddings': Run admin panel to generate embeddings on photo upload")
print("   3. If 'dlib not installed': See INSTALLATION_GUIDE.md for Windows setup")
print("   4. If embeddings exist: Try higher threshold (0.8) or check doorbell image quality")

print("\n" + "=" * 90 + "\n")

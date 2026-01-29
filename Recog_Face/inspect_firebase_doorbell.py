"""
Check actual doorbell events being stored in Firebase to understand what's being processed.
"""

import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).parent.parent
RECOG_ROOT = Path(__file__).parent
sys.path.insert(0, str(RECOG_ROOT / "src"))

load_dotenv(RECOG_ROOT / ".env")

# Check Firebase credentials
CREDS_PATH = REPO_ROOT / "backend" / "config" / "firebase-service-account.json"

if not CREDS_PATH.exists():
    print(f"❌ Firebase credentials not found at {CREDS_PATH}")
    sys.exit(1)

print("=" * 90)
print(" FIREBASE DOORBELL EVENTS INSPECTOR")
print("=" * 90)

try:
    import firebase_admin
    from firebase_admin import db, credentials
    
    # Initialize Firebase
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(str(CREDS_PATH))
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app'
        })
    
    print("\n✅ Connected to Firebase")
    
    # Check doorbell events
    print("\n[CHECK] Reading /doorbell_events...")
    ref = db.reference('/doorbell_events')
    data = ref.get()
    
    if data:
        if isinstance(data, dict):
            event_count = len(data)
            print(f"✅ Found {event_count} doorbell events")
            
            # Show last 3 events
            print("\nRecent events (last 3):")
            for i, (key, event) in enumerate(list(data.items())[-3:]):
                print(f"\n  Event {i+1}: {key}")
                print(f"    ├─ Timestamp: {event.get('timestamp', 'N/A')}")
                print(f"    ├─ Image size: {len(event.get('image', '')) // 1024}KB")
                print(f"    ├─ Image starts with: {event.get('image', '')[:50]}...")
                
                # Check if image is valid base64
                image_b64 = event.get('image', '')
                if len(image_b64) > 100:
                    try:
                        import base64
                        decoded = base64.b64decode(image_b64[:100])
                        print(f"    └─ ✅ Valid base64 image")
                    except:
                        print(f"    └─ ❌ Invalid base64 format")
        else:
            print(f"ℹ️  doorbell_events data type: {type(data)}")
    else:
        print("❌ No doorbell events found at /doorbell_events")
    
    # Check recognition results
    print("\n[CHECK] Reading /recognition_results...")
    ref = db.reference('/recognition_results')
    results = ref.get()
    
    if results:
        if isinstance(results, dict):
            result_count = len(results)
            print(f"✅ Found {result_count} recognition results")
            
            # Show recent results
            print("\nRecent results (last 5):")
            for i, (key, result) in enumerate(list(results.items())[-5:]):
                recognized = result.get('recognized')
                name = result.get('name', 'Unknown')
                confidence = result.get('confidence', 0)
                error = result.get('error')
                
                status = "✅" if recognized else "❌"
                print(f"  {status} {key}: {name} (confidence: {confidence:.2f})")
                if error:
                    print(f"      Error: {error}")
        else:
            print(f"ℹ️  recognition_results data type: {type(results)}")
    else:
        print("ℹ️  No recognition results yet")
    
    # Check active visitors in Supabase
    print("\n[CHECK] Reading active visitors from Supabase...")
    sys.path.insert(0, str(RECOG_ROOT / "src"))
    from supabase_client import fetch_active_visitors_with_embeddings
    
    try:
        visitors = fetch_active_visitors_with_embeddings()
        if visitors:
            print(f"✅ Found {len(visitors)} active visitors with embeddings")
            total_embeddings = sum(len(v.get("face_embeddings", [])) for v in visitors)
            print(f"   Total embeddings: {total_embeddings}")
            for v in visitors:
                name = v.get("name")
                embs = len(v.get("face_embeddings", []))
                print(f"   • {name}: {embs} embeddings")
        else:
            print("❌ No active visitors with embeddings in Supabase")
            print("   THIS IS LIKELY WHY RECOGNITION FAILS!")
    except Exception as e:
        print(f"⚠️  Error reading Supabase: {e}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 90)

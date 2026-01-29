#!/usr/bin/env python3
"""
Generate face embeddings from visitor images stored in Supabase using DeepFace.
Alternative to face_recognition (which requires dlib - Windows compilation issue).

DeepFace uses TensorFlow-based models and works on Windows without compilation.
"""

import json
import os
import sys
import time
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.request import urlopen

import numpy as np
from dotenv import load_dotenv
from PIL import Image
import io

# Setup paths
REPO_ROOT = Path(__file__).parent.parent
RECOG_ROOT = REPO_ROOT / "Recog_Face"
sys.path.insert(0, str(RECOG_ROOT / "src"))

load_dotenv(RECOG_ROOT / ".env")

print("\n" + "=" * 90)
print(" FACE EMBEDDINGS GENERATOR (DeepFace) - No dlib required!")
print("=" * 90)

# ============= PHASE 1: Check dependencies =============
print("\n[PHASE 1] Checking dependencies...")

try:
    from deepface import DeepFace
    print("✅ DeepFace available")
except ImportError as e:
    print(f"❌ DeepFace not installed")
    print("Installing DeepFace...")
    os.system(f"{sys.executable} -m pip install deepface -q")
    try:
        from deepface import DeepFace
        print("✅ DeepFace installed successfully")
    except:
        print("❌ Failed to install DeepFace")
        print("Try manually: pip install deepface tensorflow")
        sys.exit(1)

# ============= PHASE 2: Connect to Supabase =============
print("\n[PHASE 2] Connecting to Supabase...")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not set in .env")
    sys.exit(1)

try:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

# ============= PHASE 3: Fetch visitors with images =============
print("\n[PHASE 3] Fetching visitors with images...")

try:
    response = client.table("visitors").select("id,name,image_urls,status").execute()
    visitors = response.data or []
    print(f"✅ Found {len(visitors)} visitors")
    
    # Filter visitors with images
    visitors_with_images = [
        v for v in visitors 
        if v.get("image_urls") and isinstance(v.get("image_urls"), (list, dict))
    ]
    
    # Handle both list and dict formats for image_urls
    for visitor in visitors_with_images:
        urls = visitor.get("image_urls")
        if isinstance(urls, dict):
            urls = list(urls.values()) if urls else []
        elif isinstance(urls, str):
            try:
                urls = json.loads(urls)
            except:
                urls = []
        visitor["_image_urls_list"] = urls if isinstance(urls, list) else []
    
    print(f"✅ Found {len(visitors_with_images)} visitors with images")
    
except Exception as e:
    print(f"❌ Failed to fetch visitors: {e}")
    sys.exit(1)

# ============= PHASE 4: Generate embeddings =============
print("\n[PHASE 4] Generating embeddings from images...")
print("-" * 90)

successful = 0
failed = 0

for visitor in visitors_with_images:
    visitor_id = visitor.get("id")
    name = visitor.get("name", "Unknown")
    image_urls = visitor.get("_image_urls_list", [])
    
    print(f"\n📝 Processing: {name} ({visitor_id})")
    print(f"   Images to process: {len(image_urls)}")
    
    embeddings = []
    
    for idx, url in enumerate(image_urls):
        try:
            print(f"   [{idx+1}/{len(image_urls)}] Downloading: {url[:60]}...")
            
            # Download image
            with urlopen(url, timeout=10) as response:
                image_data = response.read()
            
            # Load image
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Use proper temp directory that works on Windows and Linux
            temp_fd, image_path = tempfile.mkstemp(suffix=".jpg")
            os.close(temp_fd)
            image.save(image_path)
            
            # Extract face embedding using DeepFace
            try:
                embedding_objs = DeepFace.represent(
                    img_path=image_path,
                    model_name="Facenet512"  # Or "VGGFace2", "ArcFace"
                )
                
                if embedding_objs and len(embedding_objs) > 0:
                    # Take first face embedding
                    embedding = embedding_objs[0]["embedding"]
                    embeddings.append(embedding)
                    print(f"        ✅ Embedding extracted ({len(embedding)} dimensions)")
                else:
                    print(f"        ⚠️  No face detected in image")
                    
            except Exception as e:
                print(f"        ⚠️  Could not extract embedding: {str(e)[:50]}")
            
            # Clean up temp file
            try:
                os.remove(image_path)
            except:
                pass
            
        except Exception as e:
            print(f"        ❌ Error: {str(e)[:60]}")
            continue
    
    # Store embeddings to Supabase
    if embeddings:
        try:
            print(f"   💾 Storing {len(embeddings)} embedding(s) to Supabase...")
            
            client.table("visitors").update({
                "face_embeddings": embeddings,
                "last_synced_for_face_recognition": int(time.time() * 1000)
            }).eq("id", visitor_id).execute()
            
            print(f"   ✅ Successfully stored {len(embeddings)} embedding(s)")
            successful += 1
            
        except Exception as e:
            print(f"   ❌ Failed to store: {e}")
            failed += 1
    else:
        print(f"   ❌ No embeddings generated (no faces detected)")
        failed += 1

# ============= PHASE 5: Verify =============
print("\n" + "=" * 90)
print("[PHASE 5] Verification...")
print("-" * 90)

try:
    response = client.table("visitors").select("id,name,face_embeddings").execute()
    all_visitors = response.data or []
    
    with_embeddings = sum(
        1 for v in all_visitors 
        if v.get("face_embeddings") and len(v.get("face_embeddings", [])) > 0
    )
    
    print(f"\n✅ SUMMARY:")
    print(f"   • Successfully processed: {successful} visitor(s)")
    print(f"   • Failed: {failed} visitor(s)")
    print(f"   • Total visitors with embeddings in DB: {with_embeddings}")
    
    if with_embeddings > 0:
        print(f"\n🎉 SUCCESS! Your system is ready for face recognition!")
        print(f"   • Embeddings: ✅ Available")
        print(f"   • Doorbell images: ✅ Will be compared against {with_embeddings} visitor(s)")
        print(f"\n   Next step: Test with a doorbell image")
    else:
        print(f"\n⚠️  No embeddings were generated")
        print(f"   Possible causes:")
        print(f"   • No faces detected in images (low quality/angle)")
        print(f"   • Images are not publicly accessible")
        print(f"   • Incorrect image URLs in Supabase")
        
except Exception as e:
    print(f"❌ Verification failed: {e}")

print("\n" + "=" * 90 + "\n")

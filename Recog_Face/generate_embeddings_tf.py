#!/usr/bin/env python3
"""
Generate embeddings using TensorFlow directly.
Simpler than DeepFace, no dlib required, works on Windows.
"""

import json
import os
import sys
import time
import tempfile
from pathlib import Path
from urllib.request import urlopen

from dotenv import load_dotenv
from PIL import Image
import numpy as np
import io

# Setup paths
REPO_ROOT = Path(__file__).parent.parent
RECOG_ROOT = Path(__file__).parent
sys.path.insert(0, str(RECOG_ROOT / "src"))

load_dotenv(RECOG_ROOT / ".env")

print("\n" + "=" * 90)
print(" FACE EMBEDDINGS GENERATOR - TensorFlow Method")
print("=" * 90)

# ============= PHASE 1: Check dependencies =============
print("\n[PHASE 1] Checking dependencies...")

try:
    import tensorflow as tf
    print(f"✅ TensorFlow available (v{tf.__version__})")
except ImportError:
    print("❌ TensorFlow not installed")
    sys.exit(1)

# Load MobileNetV2 for embeddings
print("Loading face embedding model (MobileNetV2)...")
try:
    model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
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
    visitors_with_images = []
    for v in visitors:
        urls = v.get("image_urls")
        if urls:
            if isinstance(urls, dict):
                urls = list(urls.values()) if urls else []
            elif isinstance(urls, str):
                try:
                    urls = json.loads(urls)
                except:
                    urls = []
            if urls:
                v["_image_urls_list"] = urls if isinstance(urls, list) else []
                visitors_with_images.append(v)
    
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
    
    print(f"\n📝 Processing: {name}")
    print(f"   Images to process: {len(image_urls)}")
    
    embeddings = []
    
    for idx, url in enumerate(image_urls):
        try:
            print(f"   [{idx+1}/{len(image_urls)}] Processing image...")
            
            # Download image
            with urlopen(url, timeout=10) as response:
                image_data = response.read()
            
            # Load and preprocess image
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            image = image.resize((224, 224))
            image_array = np.array(image) / 255.0
            image_array = np.expand_dims(image_array, axis=0)
            
            # Generate embedding
            embedding = model.predict(image_array, verbose=0)[0]
            embeddings.append(embedding.tolist())
            print(f"        ✅ Embedding extracted ({len(embedding)} dimensions)")
            
        except Exception as e:
            print(f"        ❌ Error: {str(e)[:60]}")
            continue
    
    # Store embeddings to Supabase
    if embeddings:
        try:
            print(f"   💾 Storing {len(embeddings)} embedding(s)...")
            
            client.table("visitors").update({
                "face_embeddings": embeddings,
                "last_synced_for_face_recognition": int(time.time() * 1000)
            }).eq("id", visitor_id).execute()
            
            print(f"   ✅ Stored successfully!")
            successful += 1
            
        except Exception as e:
            print(f"   ❌ Failed to store: {e}")
            failed += 1
    else:
        print(f"   ❌ No embeddings generated")
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
    print(f"   • Total visitors with embeddings: {with_embeddings}")
    
    if with_embeddings > 0:
        print(f"\n🎉 SUCCESS! Embeddings generated!")
        print(f"   Ready for face recognition ✅")
    else:
        print(f"\n⚠️  No embeddings generated")
        
except Exception as e:
    print(f"❌ Verification failed: {e}")

print("\n" + "=" * 90 + "\n")

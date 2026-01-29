#!/usr/bin/env python3
"""
FINAL TEST: Verify face recognition works end-to-end
Tests the complete pipeline with Supabase embeddings
"""
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

print("\n" + "="*80)
print("🧪 TESTING FACE RECOGNITION SYSTEM - COMPLETE PIPELINE")
print("="*80)

# Step 1: Load recognizer with Supabase embeddings
print("\n[1/4] Loading recognizer with Supabase embeddings...")
try:
    from recognize_supabase import SupabaseRecognizer
    recognizer = SupabaseRecognizer()
    
    stats = recognizer.get_stats()
    if stats['total_visitors'] == 0:
        print("❌ No visitors loaded from Supabase!")
        print("   Run: .venv_recog\\Scripts\\python.exe generate_embeddings_tf.py")
        sys.exit(1)
    
    print(f"✅ Loaded {stats['total_visitors']} visitor(s):")
    for vid, vdata in recognizer.db.items():
        print(f"   • {vdata['name']}: {len(vdata['embeddings'])} embedding(s)")
        
except Exception as e:
    print(f"❌ Failed to load recognizer: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 2: Test with a visitor image from Supabase
print("\n[2/4] Fetching test image from Supabase...")
try:
    from supabase import create_client
    from dotenv import load_dotenv
    import cv2
    import numpy as np
    from urllib.request import urlopen
    from PIL import Image
    import io
    
    load_dotenv()
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get first visitor with images
    response = client.table("visitors").select("name,image_urls").limit(1).execute()
    if not response.data or len(response.data) == 0:
        print("❌ No visitors found in Supabase")
        sys.exit(1)
    
    visitor = response.data[0]
    test_name = visitor['name']
    image_urls = visitor['image_urls']
    
    if isinstance(image_urls, dict):
        image_urls = list(image_urls.values())
    
    test_url = image_urls[0] if image_urls else None
    
    if not test_url:
        print(f"❌ No images for {test_name}")
        sys.exit(1)
    
    print(f"✅ Testing with: {test_name}")
    print(f"   Image: {test_url[:60]}...")
    
    # Download and convert image
    with urlopen(test_url, timeout=10) as resp:
        image_data = resp.read()
    
    pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    test_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    
    print(f"✅ Image loaded: {test_image.shape}")
    
except Exception as e:
    print(f"❌ Failed to load test image: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 3: Run recognition
print("\n[3/4] Running face recognition...")
try:
    results = recognizer.recognize(test_image)
    
    if len(results) == 0:
        print("❌ No faces detected in image!")
        print("   Possible issues:")
        print("   • Image quality too low")
        print("   • No clear face visible")
        print("   • Face detection threshold too strict")
        sys.exit(1)
    
    print(f"✅ Detected {len(results)} face(s)")
    
except Exception as e:
    print(f"❌ Recognition failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Verify results
print("\n[4/4] Verifying recognition results...")
print("-" * 80)

success = False
for i, result in enumerate(results):
    x1, y1, x2, y2, name, confidence = result
    
    print(f"\nFace {i+1}:")
    print(f"  Name: {name}")
    print(f"  Confidence: {confidence:.2%}")
    print(f"  Expected: {test_name}")
    
    if name == test_name:
        print(f"  ✅ CORRECT MATCH!")
        success = True
    elif name == "Unknown":
        print(f"  ❌ NOT RECOGNIZED (returned Unknown)")
        print(f"  → Distance threshold may be too strict")
        print(f"  → Try increasing SIMILARITY_THRESHOLD in .env to 15.0")
    else:
        print(f"  ❌ WRONG MATCH (got {name}, expected {test_name})")

print("\n" + "="*80)
if success:
    print("🎉 SUCCESS! Recognition system working correctly!")
    print("="*80)
    print("\n✅ Your system is ready:")
    print("   • Supabase embeddings: ✅ Loaded")
    print("   • Model compatibility: ✅ MobileNetV2 (matching)")
    print("   • Recognition accuracy: ✅ Working")
    print("\n🚀 Next steps:")
    print("   1. Start API: python api.py")
    print("   2. Trigger doorbell event")
    print("   3. Check Firebase /recognition_results for visitor names")
else:
    print("❌ RECOGNITION FAILED")
    print("="*80)
    print("\n🔧 Troubleshooting:")
    print("   1. Increase threshold in .env:")
    print("      SIMILARITY_THRESHOLD=15.0")
    print("   2. Regenerate embeddings with better photos:")
    print("      .venv_recog\\Scripts\\python.exe generate_embeddings_tf.py")
    print("   3. Check image quality (lighting, angle, distance)")
    print("\n   Then run this test again.")
    sys.exit(1)

print("\n")

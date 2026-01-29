#!/usr/bin/env python3
"""Quick test of DeepFace to see if it's working"""

import sys
from pathlib import Path

print("Testing DeepFace installation...")

try:
    from deepface import DeepFace
    print("✅ DeepFace imported successfully")
    
    # Check available models
    print("\n📊 DeepFace available models:")
    print(f"   - Version: {DeepFace.__version__ if hasattr(DeepFace, '__version__') else 'Unknown'}")
    
    # Test with a sample image from dataset
    test_images = list(Path("dataset").glob("*/*.jpg"))[:1]
    
    if test_images:
        test_image = test_images[0]
        print(f"\n🧪 Testing with image: {test_image}")
        
        try:
            # Try the represent function
            result = DeepFace.represent(
                img_path=str(test_image),
                model_name="Facenet512",
                enforce_detection=True
            )
            print(f"✅ DeepFace.represent() works!")
            print(f"   Result type: {type(result)}")
            if isinstance(result, list) and len(result) > 0:
                print(f"   First result keys: {result[0].keys()}")
                if "embedding" in result[0]:
                    print(f"   Embedding dimension: {len(result[0]['embedding'])}")
        except Exception as e:
            print(f"❌ DeepFace.represent() failed: {e}")
            print("\n💡 Trying alternative method...")
            
            # Try without enforce_detection
            try:
                result = DeepFace.represent(
                    img_path=str(test_image),
                    model_name="Facenet512",
                    enforce_detection=False
                )
                print(f"✅ Works without enforce_detection!")
            except Exception as e2:
                print(f"❌ Also failed: {e2}")
    else:
        print("⚠️  No test images found in dataset/")
        
except ImportError as e:
    print(f"❌ Failed to import DeepFace: {e}")
    print("\nInstalling DeepFace...")
    import os
    os.system(f"{sys.executable} -m pip install deepface -q")
    print("✅ Installed. Try running this script again.")

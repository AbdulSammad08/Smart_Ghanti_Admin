#!/usr/bin/env python3
"""
Quick test to verify Supabase embeddings are loaded correctly
"""
import sys
from pathlib import Path

# Ensure we're running with all dependencies
try:
    import numpy as np
    import cv2
    import supabase
except ImportError as e:
    print(f"\n❌ Missing dependencies: {e}")
    print("\nPlease install required packages:")
    print("  pip install numpy opencv-python supabase python-dotenv")
    print("\nOr activate your virtual environment:")
    print("  .venv\\Scripts\\activate  (Windows)")
    sys.exit(1)

# Add src to path
RECOG_ROOT = Path(__file__).parent
sys.path.insert(0, str(RECOG_ROOT / "src"))

print("\n" + "="*70)
print("TESTING SUPABASE FACE RECOGNITION")
print("="*70)

print("\n[STEP 1] Loading Supabase recognizer...")
try:
    from src.recognize_supabase import SupabaseRecognizer
    recognizer = SupabaseRecognizer()
    print("[STEP 1] ✅ Recognizer loaded")
except Exception as e:
    print(f"[STEP 1] ❌ Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n[STEP 2] Checking embeddings...")
stats = recognizer.get_stats()
print(f"[STEP 2] Visitors loaded: {stats['total_visitors']}")
print(f"[STEP 2] Total embeddings: {stats['total_embeddings']}")
print(f"[STEP 2] Supabase connected: {stats['supabase_connected']}")

if stats['total_visitors'] == 0:
    print("\n❌ ERROR: No visitors with embeddings found!")
    print("Did you run generate_embeddings_tf.py?")
    sys.exit(1)

print("\n[STEP 3] Listing visitors...")
for visitor_id, visitor_data in recognizer.db.items():
    name = visitor_data['name']
    num_embeddings = len(visitor_data['embeddings'])
    print(f"  • {name}: {num_embeddings} embedding(s)")

print("\n" + "="*70)
print("✅ SUCCESS! Supabase embeddings loaded correctly")
print("="*70)
print("\nYour system is ready to recognize faces from Supabase!")
print("\nNext steps:")
print("1. Start the API: python api.py")
print("2. Test with doorbell images")
print("3. Check Firebase recognition_results for visitor names")
print("\n")

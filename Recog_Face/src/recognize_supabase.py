"""
Face Recognition using Supabase embeddings
Updated version that reads embeddings from Supabase instead of local dataset
"""
import pickle
import numpy as np
import cv2
import os
import json
import hashlib
from typing import List, Tuple, Dict, Optional

# Support both relative and absolute imports
try:
    from .mobilenet_encoder import MobileNetEncoder
    from .detector import FaceDetector
    from .config import (
        SIMILARITY_THRESHOLD, 
        SUPABASE_URL, 
        SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_VISITORS_TABLE,
        EMBEDDING_DIR,
        LOG_DETAILED_COMPARISONS
    )
except ImportError:
    from mobilenet_encoder import MobileNetEncoder
    from detector import FaceDetector
    from config import (
        SIMILARITY_THRESHOLD, 
        SUPABASE_URL, 
        SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_VISITORS_TABLE,
        EMBEDDING_DIR,
        LOG_DETAILED_COMPARISONS
    )


class SupabaseRecognizer:
    """
    Face recognition using embeddings stored in Supabase.
    Caches embeddings locally for performance.
    """
    
    def __init__(self):
        """Initialize recognizer with Supabase connection"""
        self.detector = FaceDetector()
        self.encoder = MobileNetEncoder()  # SAME model as embedding generator!
        self.db = {}  # {visitor_id: {'name': str, 'embeddings': list}}
        self.supabase_client = None
        
        # Initialize Supabase connection
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            print("[Recognizer] ⚠️  WARNING: Supabase credentials not configured")
            print("[Recognizer] Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        else:
            self._init_supabase()
            self._load_embeddings_from_supabase()
    
    def _init_supabase(self):
        """Initialize Supabase client"""
        try:
            from supabase import create_client
            self.supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            print("[Recognizer] ✅ Connected to Supabase")
        except ImportError:
            print("[Recognizer] ❌ supabase-py not installed. Run: pip install supabase")
            self.supabase_client = None
        except Exception as e:
            print(f"[Recognizer] ❌ Failed to connect to Supabase: {e}")
            self.supabase_client = None
    
    def _load_embeddings_from_supabase(self):
        """
        Load all visitor embeddings from Supabase.
        Creates a local cache for fast recognition.
        """
        if not self.supabase_client:
            print("[Recognizer] ⚠️  Cannot load embeddings: Supabase not connected")
            return
        
        try:
            print("[Recognizer] Loading embeddings from Supabase...")
            
            # Fetch all active visitors with embeddings
            response = self.supabase_client.table(SUPABASE_VISITORS_TABLE).select(
                "id,name,face_embeddings,status"
            ).eq("status", "active").execute()
            
            visitors = response.data or []
            loaded_count = 0
            
            for visitor in visitors:
                visitor_id = visitor.get('id')
                name = visitor.get('name', 'Unknown')
                embeddings = visitor.get('face_embeddings')
                
                # Validate embeddings
                if not embeddings or not isinstance(embeddings, list) or len(embeddings) == 0:
                    if LOG_DETAILED_COMPARISONS:
                        print(f"[Recognizer] ⚠️  {name}: No embeddings found")
                    continue
                
                # Store embeddings (each visitor can have multiple face embeddings)
                self.db[visitor_id] = {
                    'name': name,
                    'embeddings': [np.array(emb, dtype=np.float32) for emb in embeddings]
                }
                loaded_count += 1
                
                if LOG_DETAILED_COMPARISONS:
                    print(f"[Recognizer] ✅ {name}: Loaded {len(embeddings)} embedding(s)")
            
            print(f"[Recognizer] ✅ Loaded {loaded_count} visitor(s) with embeddings")
            
            if loaded_count == 0:
                print("[Recognizer] ⚠️  WARNING: No embeddings found in Supabase!")
                print("[Recognizer] Did you run generate_embeddings_tf.py?")
            
        except Exception as e:
            print(f"[Recognizer] ❌ Error loading embeddings: {e}")
            import traceback
            traceback.print_exc()
    
    def reload_embeddings(self):
        """
        Reload embeddings from Supabase.
        Call this when visitor data is updated.
        """
        print("[Recognizer] Reloading embeddings from Supabase...")
        self.db.clear()
        self._load_embeddings_from_supabase()
    
    def recognize(self, img: np.ndarray) -> List[Tuple[int, int, int, int, str, float]]:
        """
        Recognize faces in an image.
        
        Args:
            img: OpenCV image (BGR format)
        
        Returns:
            List of (x1, y1, x2, y2, name, confidence) tuples
        """
        if len(self.db) == 0:
            print("[Recognizer] ⚠️  No embeddings loaded - cannot recognize faces")
            return []
        
        # Detect faces
        boxes = self.detector.detect(img)
        results = []
        
        if LOG_DETAILED_COMPARISONS:
            print(f"[Recognizer] Detected {len(boxes)} face(s)")
        
        for (x1, y1, x2, y2) in boxes:
            # Extract face region
            face = img[y1:y2, x1:x2]
            
            # Generate embedding for detected face
            face_embedding = self.encoder.encode(face)
            
            # Find best match
            best_name = "Unknown"
            best_distance = float('inf')
            best_confidence = 0.0
            
            for visitor_id, visitor_data in self.db.items():
                visitor_name = visitor_data['name']
                visitor_embeddings = visitor_data['embeddings']
                
                # Compare against all embeddings for this visitor
                for stored_embedding in visitor_embeddings:
                    distance = np.linalg.norm(stored_embedding - face_embedding)
                    
                    if distance < best_distance:
                        best_distance = distance
                        best_name = visitor_name
            
            # Apply threshold
            if best_distance > SIMILARITY_THRESHOLD:
                best_name = "Unknown"
                confidence = 0.0
            else:
                # Convert distance to confidence (lower distance = higher confidence)
                confidence = max(0.0, 1.0 - (best_distance / SIMILARITY_THRESHOLD))
            
            if LOG_DETAILED_COMPARISONS:
                print(f"[Recognizer] Match: {best_name} (distance: {best_distance:.3f}, confidence: {confidence:.2%})")
            
            results.append((x1, y1, x2, y2, best_name, confidence))
        
        return results
    
    def recognize_from_base64(self, base64_image: str) -> List[Tuple[int, int, int, int, str, float]]:
        """
        Process a base64-encoded image and return recognition results.
        
        Args:
            base64_image: Base64-encoded image string
        
        Returns:
            List of (x1, y1, x2, y2, name, confidence) tuples
        """
        import base64
        import io
        from PIL import Image
        
        try:
            # Decode base64
            image_bytes = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_bytes))
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Recognize
            return self.recognize(img)
        except Exception as e:
            print(f"[Recognizer] ❌ Error processing base64 image: {e}")
            return []
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about loaded embeddings"""
        total_embeddings = sum(len(v['embeddings']) for v in self.db.values())
        return {
            'total_visitors': len(self.db),
            'total_embeddings': total_embeddings,
            'supabase_connected': self.supabase_client is not None
        }


# Backward compatibility - use Supabase version by default
Recognizer = SupabaseRecognizer

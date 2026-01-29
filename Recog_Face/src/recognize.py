import pickle
import numpy as np
import cv2
import os
import json
import hashlib

from .face_encoder import FaceEncoder
from .detector import FaceDetector
from .config import EMBEDDING_DB, SIMILARITY_THRESHOLD, DATASET_DIR, EMBEDDING_DIR

class Recognizer:
    def __init__(self):
        self.detector = FaceDetector()
        self.encoder = FaceEncoder()

        # Check if database needs rebuild
        if self._needs_rebuild():
            print("Dataset changed. Rebuilding face embeddings database...")
            self._build_embeddings()

        with open(EMBEDDING_DB, "rb") as f:
            self.db = pickle.load(f)
    
    def _get_dataset_hash(self):
        """Generate hash of dataset structure and file count"""
        dataset_info = {}
        for person in sorted(os.listdir(DATASET_DIR)):
            person_path = os.path.join(DATASET_DIR, person)
            if os.path.isdir(person_path):
                files = [f for f in os.listdir(person_path) 
                        if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
                dataset_info[person] = len(files)
        
        return hashlib.md5(json.dumps(dataset_info, sort_keys=True).encode()).hexdigest()
    
    def _needs_rebuild(self):
        """Check if database needs to be rebuilt"""
        hash_file = os.path.join(EMBEDDING_DIR, ".dataset_hash")
        
        # If no database exists, rebuild
        if not os.path.exists(EMBEDDING_DB):
            return True
        
        # Get current dataset hash
        current_hash = self._get_dataset_hash()
        
        # Check if hash file exists and matches
        if os.path.exists(hash_file):
            with open(hash_file, 'r') as f:
                stored_hash = f.read().strip()
            if stored_hash == current_hash:
                return False
        
        return True
    
    def _build_embeddings(self):
        if not os.path.exists(EMBEDDING_DIR):
            os.makedirs(EMBEDDING_DIR)
        
        db = {}
        for person in os.listdir(DATASET_DIR):
            person_path = os.path.join(DATASET_DIR, person)
            if not os.path.isdir(person_path):
                continue
            
            vectors = []
            for img_name in os.listdir(person_path):
                if not img_name.lower().endswith((".jpg", ".png", ".jpeg")):
                    continue
                
                img_path = os.path.join(person_path, img_name)
                img = cv2.imread(img_path)
                boxes = self.detector.detect(img)
                
                if len(boxes) == 0:
                    continue
                
                (x1, y1, x2, y2) = boxes[0]
                face = img[y1:y2, x1:x2]
                vec = self.encoder.encode(face)
                vectors.append(vec)
            
            if len(vectors) > 0:
                db[person] = np.mean(vectors, axis=0)
        
        with open(EMBEDDING_DB, "wb") as f:
            pickle.dump(db, f)
        
        # Save dataset hash
        hash_file = os.path.join(EMBEDDING_DIR, ".dataset_hash")
        with open(hash_file, 'w') as f:
            f.write(self._get_dataset_hash())
        
        print(f"Face database built with {len(db)} people.")
        self.db = db

    def recognize(self, img):
        boxes = self.detector.detect(img)
        results = []

        for (x1, y1, x2, y2) in boxes:
            face = img[y1:y2, x1:x2]
            emb = self.encoder.encode(face)

            name = "Unknown"
            best_score = 999

            for person, saved_emb in self.db.items():
                dist = np.linalg.norm(saved_emb - emb)
                if dist < best_score:
                    best_score = dist
                    name = person

            if best_score > SIMILARITY_THRESHOLD:
                name = "Unknown"

            results.append((x1, y1, x2, y2, name))

        return results
    
    def recognize_from_base64(self, base64_image):
        """Process a base64-encoded image and return recognition results"""
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
            print(f"[Recognizer] Error processing base64 image: {e}")
            return []

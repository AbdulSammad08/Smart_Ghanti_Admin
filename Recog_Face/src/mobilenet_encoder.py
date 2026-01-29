"""
MobileNetV2 Face Encoder - SAME model used for Supabase embeddings
This ensures compatibility between stored embeddings and live recognition
"""
import numpy as np
import cv2

class MobileNetEncoder:
    """Face encoder using MobileNetV2 (same as embedding generator)"""
    
    def __init__(self):
        """Initialize MobileNetV2 model"""
        print("[MobileNetEncoder] Loading MobileNetV2 model...")
        
        try:
            import tensorflow as tf
            # Suppress TensorFlow warnings
            import os
            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
            
            # Load same model used in generate_embeddings_tf.py
            self.model = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights='imagenet',
                pooling='avg'
            )
            self.input_size = (224, 224)
            print("[MobileNetEncoder] ✅ Model loaded (1280-dim embeddings)")
            
        except Exception as e:
            print(f"[MobileNetEncoder] ❌ Failed to load model: {e}")
            raise
    
    def encode(self, face_img):
        """
        Encode a face image into a 1280-dimensional embedding vector.
        
        Args:
            face_img: OpenCV BGR image of a detected face
            
        Returns:
            numpy array of shape (1280,) - face embedding
        """
        try:
            # Resize to model input size
            face_resized = cv2.resize(face_img, self.input_size)
            
            # Convert BGR to RGB
            face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
            
            # Normalize pixel values to [0, 1]
            face_normalized = face_rgb.astype(np.float32) / 255.0
            
            # Add batch dimension
            face_batch = np.expand_dims(face_normalized, axis=0)
            
            # Generate embedding
            embedding = self.model.predict(face_batch, verbose=0)[0]
            
            return embedding.astype(np.float32)
            
        except Exception as e:
            print(f"[MobileNetEncoder] Error encoding face: {e}")
            # Return zero vector on error
            return np.zeros(1280, dtype=np.float32)

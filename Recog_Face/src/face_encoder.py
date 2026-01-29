import cv2
import numpy as np
import sys
import tensorflow as tf
# Make tensorflow.keras available
sys.modules['tensorflow.keras'] = tf.keras

from deepface import DeepFace
from .config import FACE_SIZE

class FaceEncoder:
    def __init__(self):
        pass

    def encode(self, face_img):
        face = cv2.resize(face_img, FACE_SIZE)
        embedding = DeepFace.represent(face, model_name='Facenet', enforce_detection=False)[0]['embedding']
        return np.array(embedding)

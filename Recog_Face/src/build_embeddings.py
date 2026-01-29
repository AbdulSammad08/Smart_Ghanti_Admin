import os
import pickle
import cv2
import numpy as np

from .face_encoder import FaceEncoder
from .detector import FaceDetector
from .config import DATASET_DIR, EMBEDDING_DB, EMBEDDING_DIR

def build():
    if not os.path.exists(EMBEDDING_DIR):
        os.makedirs(EMBEDDING_DIR)

    encoder = FaceEncoder()
    detector = FaceDetector()

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
            boxes = detector.detect(img)

            if len(boxes) == 0:
                continue

            (x1, y1, x2, y2) = boxes[0]
            face = img[y1:y2, x1:x2]
            vec = encoder.encode(face)
            vectors.append(vec)

        if len(vectors) > 0:
            db[person] = np.mean(vectors, axis=0)

    with open(EMBEDDING_DB, "wb") as f:
        pickle.dump(db, f)

    print("Face DB built successfully.")

if __name__ == "__main__":
    build()

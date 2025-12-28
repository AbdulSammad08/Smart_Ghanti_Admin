import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_DIR = os.path.join(BASE_DIR, "dataset")
EMBEDDING_DIR = os.path.join(BASE_DIR, "embeddings")
EMBEDDING_DB = os.path.join(EMBEDDING_DIR, "face_db.pkl")

YOLO_MODEL_PATH = os.path.join(BASE_DIR, "models", "yolov8n-face.pt")

FACE_SIZE = (160, 160)
SIMILARITY_THRESHOLD = 10.0  # Lower is more similar for Euclidean distance

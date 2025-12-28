from ultralytics import YOLO
import cv2
from .config import YOLO_MODEL_PATH

class FaceDetector:
    def __init__(self):
        self.model = YOLO(YOLO_MODEL_PATH)

    def detect(self, img):
        results = self.model(img, verbose=False)[0]
        boxes = []
        for b in results.boxes.data:
            x1, y1, x2, y2, score, cls = b
            boxes.append((int(x1), int(y1), int(x2), int(y2)))
        return boxes

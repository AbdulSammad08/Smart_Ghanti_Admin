from ultralytics import YOLO
import cv2

# Support both relative and absolute imports
try:
    from .config import YOLO_MODEL_PATH, DETECTION_CONFIDENCE, DETECTION_MIN_AREA, DETECTION_MAX_AREA
except ImportError:
    from config import YOLO_MODEL_PATH, DETECTION_CONFIDENCE, DETECTION_MIN_AREA, DETECTION_MAX_AREA

class FaceDetector:
    def __init__(self):
        self.model = YOLO(YOLO_MODEL_PATH)

    def detect(self, img):
        results = self.model(img, verbose=False)[0]
        boxes = []
        h, w = img.shape[:2]
        for b in results.boxes.data:
            x1, y1, x2, y2, score, cls = b
            # Filter by confidence
            if float(score) < DETECTION_CONFIDENCE:
                continue
            # Filter by area
            area = (float(x2) - float(x1)) * (float(y2) - float(y1))
            if area < DETECTION_MIN_AREA or area > DETECTION_MAX_AREA:
                continue
            boxes.append((int(x1), int(y1), int(x2), int(y2)))
        return boxes

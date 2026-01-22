import os
from dotenv import load_dotenv

# Load environment variables if a .env file is present
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================
# LOCAL DATASET & CACHING
# ============================================================
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
EMBEDDING_DIR = os.path.join(BASE_DIR, "embeddings")
EMBEDDING_DB = os.path.join(EMBEDDING_DIR, "face_db.pkl")

# ============================================================
# MODEL PATHS
# ============================================================
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "models", "yolov8n-face.pt")

# ============================================================
# FACE RECOGNITION SETTINGS
# ============================================================
FACE_SIZE = (160, 160)

# Similarity threshold for face matching
# Lower = stricter matching, Higher = more lenient
# MobileNetV2 embeddings typically need higher threshold
# Recommended: 10.0 (strict) to 15.0 (lenient)
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "12.0"))

# Threshold for doorbell-to-Supabase comparisons
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.6"))

# Minimum confidence to consider an authorized unlock
MIN_CONFIDENCE_TO_UNLOCK = float(os.getenv("MIN_CONFIDENCE_TO_UNLOCK", "0.95"))

# ============================================================
# FACE DETECTION SETTINGS (Improved Accuracy)
# ============================================================
DETECTION_CONFIDENCE = 0.5    # Filter detections below this confidence
DETECTION_MIN_AREA = 5000     # Minimum face area in pixels (reject tiny faces)
DETECTION_MAX_AREA = 500000   # Maximum face area in pixels (reject oversized faces)

# ============================================================
# FIREBASE REALTIME DATABASE
# ============================================================
FIREBASE_DATABASE_URL = "https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app"
# Resolve credentials path relative to workspace root
FIREBASE_CREDS_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "backend", "config", "firebase-service-account.json"))

# ============================================================
# SYNC SETTINGS
# ============================================================
SYNC_INTERVAL = 300           # Sync every 5 minutes (seconds)
SYNC_ENABLE_REALTIME = True   # Listen for real-time changes
SYNC_ON_STARTUP = True        # Full sync when API starts
SYNC_INCREMENTAL = True       # Use incremental sync (faster)

# ============================================================
# LOGGING & DEBUG
# ============================================================
ENABLE_LOGGING = True
DEBUG_MODE = False
LOG_FILE = os.path.join(BASE_DIR, "logs", "face_recognition.log")

# ============================================================
# SUPABASE
# ============================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or ""
SUPABASE_VISITORS_TABLE = os.getenv("SUPABASE_VISITORS_TABLE", "visitors")

# ============================================================
# RECOGNITION PIPELINE FLAGS
# ============================================================
LOG_DETAILED_COMPARISONS = os.getenv("LOG_DETAILED_COMPARISONS", "true").lower() == "true"
STORE_FAILED_RECOGNITIONS = os.getenv("STORE_FAILED_RECOGNITIONS", "false").lower() == "true"

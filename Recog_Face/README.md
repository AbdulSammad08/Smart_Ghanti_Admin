# Face Recognition System

A complete face recognition system with GUI and live webcam support.

## Features
- Image-based face recognition with GUI
- Live webcam face recognition
- Automatic face database building
- Support for multiple faces in one image
- Color-coded recognition (Green = Recognized, Red = Unknown)

## Quick Start

### 1. Image Recognition (GUI)
```bash
python gui.py
```
- Click "Select Image" to choose an image
- The system automatically builds/rebuilds the face database when needed
- No manual intervention required!

### 2. Live Webcam Recognition
```bash
python recognize.py
```
- Press 'q' to quit
- Database automatically rebuilds when dataset changes

### 3. Quality Enhanced Recognition
```bash
python increase_quality.py
```
- Automatically enhances image quality before recognition
- Applies sharpening, contrast, denoising, and upscaling
- Saves enhanced images to `enhanced_images/` folder
- See [QUALITY_ENHANCEMENT.md](QUALITY_ENHANCEMENT.md) for details

### 4. API Server (for Flutter/Mobile Apps)
```bash
python api.py
```
- REST API server runs on `http://localhost:5000`
- Endpoints: `/recognize`, `/add_person`, `/health`
- See [API_USAGE.md](API_USAGE.md) for detailed documentation
- Test with: `python test_api.py`

## Adding New Faces

1. Create a folder in `dataset/` with the person's name
2. Add 3-5 clear photos of the person's face
3. Run `python gui.py` or `python recognize.py` - database rebuilds automatically!

**Recommended Image Guidelines**:
- Resolution: At least 640x480 pixels
- Format: JPG, JPEG, or PNG
- Face visibility: Clear, front-facing
- Lighting: Good, even lighting
- Multiple angles: Include slight variations

Example:
```
dataset/
  ├── Ali/
  │   ├── photo1.jpg
  │   ├── photo2.jpg
  │   └── photo3.jpg
  ├── Azwar/
  └── Sammad/
```

## Installation

### Quick Install
```bash
pip install -r requirements.txt
```

### Detailed Installation Guide
For complete step-by-step installation instructions, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

### Prerequisites
- Python 3.10 (Required)
- pip (Python package manager)
- 2GB free disk space
- Internet connection (first run only)

### Manual Installation (if needed)

```bash
# Core ML frameworks
pip install tensorflow==2.11.0 keras==2.11.0 numpy==1.26.4

# Computer vision
pip install opencv-python==4.12.0.88

# Face recognition
pip install deepface==0.0.96

# Object detection
pip install ultralytics==8.3.0 torch torchvision

# GUI and utilities
pip install Pillow==12.0.0

# API server (optional)
pip install Flask==3.1.2 flask-cors==6.0.1
```

## Requirements (Confirmed Versions)
- Python 3.10
- TensorFlow 2.11.0
- Keras 2.11.0
- NumPy 1.26.4
- OpenCV 4.12.0.88
- DeepFace 0.0.96
- keras-vggface 0.6
- Ultralytics 8.3.235
- PyTorch 2.9.1
- torchvision 0.24.1
- Pillow 12.0.0
- Flask 3.1.2 (for API)
- Flask-CORS 6.0.1 (for API)
- scipy 1.15.3
- requests 2.32.5
- tqdm 4.67.1

All versions tested and confirmed working on Windows, Linux, and macOS.

## Models Used

### Face Detection
- **Model**: YOLOv8n-face
- **Source**: Ultralytics
- **Auto-download**: Yes (on first run)
- **Location**: `models/yolov8n-face.pt`
- **Purpose**: Detect faces in images

### Face Recognition
- **Model**: Facenet (via DeepFace)
- **Framework**: TensorFlow/Keras
- **Auto-download**: Yes (on first run)
- **Embedding Size**: 128-dimensional vectors
- **Purpose**: Generate face embeddings for recognition

## Notes
- The face database is automatically built on first run
- Database automatically rebuilds when you add/remove people from dataset
- No manual rebuild needed - system detects dataset changes automatically
- All models are automatically downloaded on first use
- System scales reliably with growing datasets
- Compatible with Windows, Linux, and macOS

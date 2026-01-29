# Installation Guide - Face Recognition System

## System Requirements

### Hardware
- **CPU**: Intel Core i5 or equivalent (minimum)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for models and dependencies
- **GPU**: Optional (CUDA-compatible for faster processing)

### Software
- **Operating System**: Windows 10/11, Linux (Ubuntu 18.04+), or macOS 10.14+
- **Python**: 3.10 (Required - other versions not tested)
- **pip**: Latest version recommended

---

## Step-by-Step Installation

### Step 1: Install Python 3.10

#### Windows
1. Download Python 3.10 from [python.org](https://www.python.org/downloads/)
2. Run installer and check "Add Python to PATH"
3. Verify installation:
   ```bash
   python --version
   # Should show: Python 3.10.x
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
python3.10 --version
```

#### macOS
```bash
brew install python@3.10
python3.10 --version
```

---

### Step 2: Clone or Download Project

```bash
# Option 1: Clone with git
git clone <repository-url>
cd Recog_Face

# Option 2: Download and extract ZIP
# Then navigate to the folder
cd Recog_Face
```

---

### Step 3: Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate
```

---

### Step 4: Install Dependencies

#### Option A: Install All at Once (Recommended)
```bash
pip install -r requirements.txt
```

#### Option B: Install Individually
```bash
# Core ML Frameworks
pip install tensorflow==2.11.0
pip install keras==2.11.0
pip install numpy==1.26.4

# Computer Vision
pip install opencv-python==4.12.0.88

# Face Recognition
pip install deepface==0.0.96
pip install keras-vggface==0.6

# Object Detection (YOLO)
pip install ultralytics==8.3.235
pip install torch==2.9.1
pip install torchvision==0.24.1

# GUI
pip install Pillow==12.0.0

# API Server
pip install Flask==3.1.2
pip install flask-cors==6.0.1

# Utilities
pip install requests==2.32.5
pip install scipy==1.15.3
pip install tqdm==4.67.1
```

---

### Step 5: Verify Installation

```bash
# Test imports
python -c "import tensorflow; import cv2; import deepface; print('✓ All packages installed successfully')"
```

---

### Step 6: Setup Dataset

1. Create dataset folder structure:
   ```
   Recog_Face/
   ├── dataset/
   │   ├── Person1/
   │   │   ├── photo1.jpg
   │   │   ├── photo2.jpg
   │   │   └── photo3.jpg
   │   ├── Person2/
   │   └── Person3/
   ```

2. Add 3-5 clear photos per person
3. Supported formats: JPG, JPEG, PNG

---

### Step 7: First Run

```bash
# Run GUI (will auto-build database)
python gui.py

# Or run webcam recognition
python recognize.py

# Or start API server
python api.py
```

---

## Verified Package Versions

All versions below are **confirmed working** on Python 3.10:

| Package | Version | Purpose |
|---------|---------|---------|
| tensorflow | 2.11.0 | Deep learning framework |
| keras | 2.11.0 | Neural network API |
| numpy | 1.26.4 | Numerical computing |
| opencv-python | 4.12.0.88 | Computer vision |
| deepface | 0.0.96 | Face recognition |
| keras-vggface | 0.6 | VGGFace models |
| ultralytics | 8.3.235 | YOLO framework |
| torch | 2.9.1 | PyTorch |
| torchvision | 0.24.1 | PyTorch vision |
| Pillow | 12.0.0 | Image processing |
| Flask | 3.1.2 | Web framework |
| flask-cors | 6.0.1 | CORS support |
| requests | 2.32.5 | HTTP library |
| scipy | 1.15.3 | Scientific computing |
| tqdm | 4.67.1 | Progress bars |

---

## Troubleshooting

### Issue: "No module named 'tensorflow'"
**Solution**: Ensure you're using Python 3.10 and virtual environment is activated

### Issue: "numpy version incompatible"
**Solution**: 
```bash
pip uninstall numpy
pip install numpy==1.26.4
```

### Issue: "CUDA not available" (GPU)
**Solution**: This is normal. The system works fine on CPU. For GPU support, install CUDA toolkit separately.

### Issue: "Port 5000 already in use" (API)
**Solution**: Change port in api.py or kill process using port 5000

### Issue: Models not downloading
**Solution**: Check internet connection. Models download automatically on first run.

---

## Platform-Specific Notes

### Windows
- Use Command Prompt or PowerShell
- Backslashes in paths: `dataset\Person1`
- Virtual environment: `venv\Scripts\activate`

### Linux
- May need `sudo` for system packages
- Forward slashes in paths: `dataset/Person1`
- Virtual environment: `source venv/bin/activate`

### macOS
- Use Terminal
- Forward slashes in paths: `dataset/Person1`
- Virtual environment: `source venv/bin/activate`
- May need Xcode Command Line Tools

---

## Post-Installation

### Test the System

1. **Test GUI**:
   ```bash
   python gui.py
   ```

2. **Test Webcam**:
   ```bash
   python recognize.py
   ```

3. **Test API**:
   ```bash
   # Terminal 1: Start server
   python api.py
   
   # Terminal 2: Test
   python test_api_complete.py
   ```

### Expected First Run Behavior

1. Models will download automatically (~100MB total)
2. Face database will build from dataset folder
3. This takes 1-2 minutes on first run
4. Subsequent runs are instant

---

## Storage Requirements

- **Python + pip**: ~100MB
- **Dependencies**: ~1.5GB
- **Models**: ~100MB (auto-downloaded)
- **Dataset**: Varies (your images)
- **Total**: ~2GB minimum

---

## Network Requirements

- **First run**: Internet required for model downloads
- **Subsequent runs**: Offline mode works fine
- **API mode**: Network access required for clients

---

## Success Indicators

✅ All packages install without errors
✅ `python gui.py` opens window
✅ Models download automatically
✅ Face database builds successfully
✅ Recognition works on test images

---

## Getting Help

If you encounter issues:

1. Check Python version: `python --version` (must be 3.10.x)
2. Check pip version: `pip --version`
3. Verify virtual environment is activated
4. Try reinstalling: `pip install -r requirements.txt --force-reinstall`
5. Check error logs in console output

---

## Quick Start Commands

```bash
# Complete setup in one go
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
python gui.py
```

---

## Confirmed Working On

- ✅ Windows 10/11 (Python 3.10)
- ✅ Ubuntu 20.04/22.04 (Python 3.10)
- ✅ macOS Monterey+ (Python 3.10)

All package versions have been tested and confirmed working on these platforms.

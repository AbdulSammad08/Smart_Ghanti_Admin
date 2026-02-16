# ============================================
# Dockerfile for Face Recognition System
# Python 3.10 + TensorFlow + OpenCV + face_recognition
# For Azure Container Apps deployment
# ============================================

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for:
# - dlib/face_recognition compilation
# - OpenCV
# - Pillow
# - General build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libopenblas-dev \
    libgomp1 \
    pkg-config \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire Recog_Face directory
COPY . .

# Install Python dependencies
# This will compile dlib/face_recognition from source
RUN pip install --no-cache-dir -r requirements.txt

# Create volume mount points
# Firebase service account will be mounted here
RUN mkdir -p /mnt/secrets

# Expose port 5000 for Flask API
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production

# Run the Flask API
CMD ["python", "api.py"]

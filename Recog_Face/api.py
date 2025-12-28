from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from src.recognize import Recognizer

app = Flask(__name__)
CORS(app)

# Initialize recognizer once
recognizer = None

def init_recognizer():
    global recognizer
    if recognizer is None:
        print("\n[INFO] Initializing Face Recognition System...")
        print("[INFO] Loading models (this may take a moment on first run)...")
        recognizer = Recognizer()
        print("[INFO] ✓ System ready!\n")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Face Recognition API is running"})

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Endpoint to recognize faces in an image
    Accepts: JSON with base64 encoded image or multipart/form-data with image file
    Returns: JSON with recognition results and authentication status
    """
    try:
        # Initialize recognizer (auto-builds database if needed)
        init_recognizer()
        
        # Handle base64 encoded image
        if request.is_json:
            data = request.get_json()
            if 'image' not in data:
                return jsonify({
                    "success": False,
                    "error": "No image provided",
                    "authenticated": False
                }), 400
            
            try:
                # Decode base64 image
                image_data = base64.b64decode(data['image'])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": f"Failed to decode image: {str(e)}",
                    "authenticated": False
                }), 400
        
        # Handle multipart form data
        elif 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({
                    "success": False,
                    "error": "No image selected",
                    "authenticated": False
                }), 400
            
            try:
                # Read image from file
                file_bytes = np.frombuffer(file.read(), np.uint8)
                frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": f"Failed to read image: {str(e)}",
                    "authenticated": False
                }), 400
        
        else:
            return jsonify({
                "success": False,
                "error": "Invalid request format. Send JSON with 'image' field or multipart form data",
                "authenticated": False
            }), 400
        
        # Validate image was decoded successfully
        if frame is None:
            return jsonify({
                "success": False,
                "error": "Invalid image format. Supported formats: JPG, PNG, BMP",
                "authenticated": False
            }), 400
        
        # Run face recognition on the image
        print(f"Processing image of size: {frame.shape}")
        results = recognizer.recognize(frame)
        print(f"Recognition complete. Found {len(results)} face(s)")
        
        # No faces detected
        if len(results) == 0:
            return jsonify({
                "success": True,
                "authenticated": False,
                "message": "No faces detected in the image",
                "faces_detected": 0,
                "faces": [],
                "recognized_count": 0,
                "unknown_count": 0
            }), 200
        
        # Format results
        faces = []
        recognized_names = []
        
        for (x1, y1, x2, y2, name) in results:
            is_recognized = name != "Unknown"
            if is_recognized:
                recognized_names.append(name)
            
            faces.append({
                "name": name,
                "recognized": is_recognized,
                "confidence": "high" if is_recognized else "none",
                "bbox": {
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                }
            })
        
        # Determine authentication status
        recognized_count = len(recognized_names)
        unknown_count = len(results) - recognized_count
        authenticated = recognized_count > 0
        
        # Prepare comprehensive response
        response = {
            "success": True,
            "authenticated": authenticated,
            "message": f"Authenticated as {', '.join(recognized_names)}" if authenticated else "No recognized faces",
            "faces_detected": len(faces),
            "recognized_count": recognized_count,
            "unknown_count": unknown_count,
            "recognized_names": recognized_names,
            "faces": faces,
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
        
        print(f"Response: Authenticated={authenticated}, Recognized={recognized_count}, Unknown={unknown_count}")
        return jsonify(response), 200
    
    except Exception as e:
        print(f"Error in recognize_face: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "authenticated": False,
            "error": str(e),
            "message": "Internal server error during face recognition"
        }), 500

@app.route('/add_person', methods=['POST'])
def add_person():
    """
    Endpoint to add a new person to the dataset
    Accepts: JSON with person name and base64 encoded image
    """
    try:
        data = request.get_json()
        
        if 'name' not in data or 'image' not in data:
            return jsonify({"error": "Name and image are required"}), 400
        
        person_name = data['name']
        image_data = base64.b64decode(data['image'])
        
        # Create person directory
        import os
        from src.config import DATASET_DIR
        person_dir = os.path.join(DATASET_DIR, person_name)
        os.makedirs(person_dir, exist_ok=True)
        
        # Save image
        import time
        filename = f"{int(time.time())}.jpg"
        filepath = os.path.join(person_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        return jsonify({
            "success": True,
            "message": f"Image added for {person_name}",
            "note": "Database will auto-rebuild on next recognition"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/authenticate', methods=['POST'])
def authenticate():
    """
    Simplified authentication endpoint
    Returns: Simple yes/no authentication result
    """
    try:
        init_recognizer()
        
        # Get image
        if request.is_json:
            data = request.get_json()
            if 'image' not in data:
                return jsonify({"authenticated": False, "error": "No image provided"}), 400
            image_data = base64.b64decode(data['image'])
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif 'image' in request.files:
            file = request.files['image']
            file_bytes = np.frombuffer(file.read(), np.uint8)
            frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        else:
            return jsonify({"authenticated": False, "error": "Invalid request"}), 400
        
        if frame is None:
            return jsonify({"authenticated": False, "error": "Invalid image"}), 400
        
        # Run recognition
        results = recognizer.recognize(frame)
        
        # Check if any recognized face
        authenticated = any(name != "Unknown" for (_, _, _, _, name) in results)
        recognized_names = [name for (_, _, _, _, name) in results if name != "Unknown"]
        
        return jsonify({
            "authenticated": authenticated,
            "person": recognized_names[0] if recognized_names else None,
            "all_recognized": recognized_names,
            "faces_count": len(results)
        }), 200
    
    except Exception as e:
        return jsonify({"authenticated": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("="*50)
    print("Face Recognition API Server")
    print("="*50)
    print("\nServer starting on http://0.0.0.0:5000")
    print("\nAvailable Endpoints:")
    print("  - GET  /health        : Health check")
    print("  - POST /recognize     : Full face recognition with details")
    print("  - POST /authenticate  : Simple authentication (yes/no)")
    print("  - POST /add_person    : Add new person to dataset")
    print("\nPress Ctrl+C to stop the server")
    print("="*50 + "\n")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\nServer stopped.")

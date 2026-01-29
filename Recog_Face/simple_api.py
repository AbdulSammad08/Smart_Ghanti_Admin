from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os

app = Flask(__name__)
CORS(app)

# Mock face database - matches the dataset names
KNOWN_FACES = {
    'Ali': True,
    'Azwar': True, 
    'Sammad': True,
    'Tayab': True,
    'Zulqarnain': True
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Face Recognition API is running"})

@app.route('/recognize', methods=['POST'])
def recognize_face():
    try:
        # Get image data
        if request.is_json:
            data = request.get_json()
            if 'image' not in data:
                return jsonify({
                    "success": False,
                    "authenticated": False,
                    "error": "No image provided"
                }), 400
            
            image_data = data['image']
        else:
            return jsonify({
                "success": False,
                "authenticated": False,
                "error": "Invalid request format"
            }), 400

        # Mock recognition - in real system this would process the image
        # For testing, randomly recognize one of the known faces
        import random
        
        # Simulate face detection
        faces_detected = random.randint(0, 2)
        
        if faces_detected == 0:
            return jsonify({
                "success": True,
                "authenticated": False,
                "message": "No faces detected",
                "faces_detected": 0,
                "recognized_count": 0,
                "unknown_count": 0,
                "recognized_names": [],
                "faces": []
            })
        
        # Simulate recognition
        recognized = random.choice([True, False])
        
        if recognized:
            # Pick a random known face
            name = random.choice(list(KNOWN_FACES.keys()))
            return jsonify({
                "success": True,
                "authenticated": True,
                "message": f"Authenticated as {name}",
                "faces_detected": 1,
                "recognized_count": 1,
                "unknown_count": 0,
                "recognized_names": [name],
                "faces": [{
                    "name": name,
                    "recognized": True,
                    "confidence": "high",
                    "bbox": {"x1": 100, "y1": 150, "x2": 300, "y2": 350}
                }]
            })
        else:
            return jsonify({
                "success": True,
                "authenticated": False,
                "message": "No recognized faces",
                "faces_detected": 1,
                "recognized_count": 0,
                "unknown_count": 1,
                "recognized_names": [],
                "faces": [{
                    "name": "Unknown",
                    "recognized": False,
                    "confidence": "none",
                    "bbox": {"x1": 100, "y1": 150, "x2": 300, "y2": 350}
                }]
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "authenticated": False,
            "error": str(e)
        }), 500

@app.route('/authenticate', methods=['POST'])
def authenticate():
    try:
        # Simple version of recognize
        result = recognize_face()
        data = result[0].get_json()
        
        return jsonify({
            "authenticated": data.get("authenticated", False),
            "person": data.get("recognized_names", [None])[0],
            "all_recognized": data.get("recognized_names", []),
            "faces_count": data.get("faces_detected", 0)
        })
    except Exception as e:
        return jsonify({"authenticated": False, "error": str(e)})

if __name__ == '__main__':
    print("="*50)
    print("Simple Face Recognition API Server")
    print("="*50)
    print("\nServer starting on http://0.0.0.0:5001")
    print("\nAvailable Endpoints:")
    print("  - GET  /health        : Health check")
    print("  - POST /recognize     : Face recognition")
    print("  - POST /authenticate  : Simple authentication")
    print("\nNote: This is a mock API for testing integration")
    print("Replace with full ML implementation when ready")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=False)
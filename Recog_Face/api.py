from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
import os
from threading import Thread
import time
from datetime import datetime
from src.config import FIREBASE_CREDS_PATH

app = Flask(__name__)
CORS(app)

# Global variables
recognizer = None
firebase_sync = None
SYNC_THREAD_RUNNING = False

def init_system():
    """Initialize face recognition system with Firebase sync"""
    global recognizer, firebase_sync, SYNC_THREAD_RUNNING
    
    if recognizer is None:
        print("\n" + "="*70)
        print("[SYSTEM] Face Recognition System with Firebase Realtime Database")
        print("="*70)
        
        try:
            # Import heavy modules lazily to avoid startup failures
            from src.recognize_supabase import SupabaseRecognizer
            from src.firebase_sync import FirebaseSyncManager

            # Step 1: Initialize recognizer (loads models and Supabase embeddings)
            print("\n[STEP 1] Loading face detection & encoding models...")
            print("[STEP 1] Loading visitor embeddings from Supabase...")
            recognizer = SupabaseRecognizer()
            print("[STEP 1] ✓ Models loaded successfully")
            
            # Step 2: Initialize Firebase sync
            print("[STEP 2] Connecting to Firebase Realtime Database...")
            if not os.path.exists(FIREBASE_CREDS_PATH):
                raise FileNotFoundError(f"Firebase credentials not found: {FIREBASE_CREDS_PATH}")
            firebase_sync = FirebaseSyncManager(FIREBASE_CREDS_PATH)
            print("[STEP 2] ✓ Firebase connected")
            
            # Step 3: Perform initial full sync
            print("[STEP 3] Performing initial visitor sync...")
            synced = firebase_sync.sync_all_visitors()
            print(f"[STEP 3] ✓ Initial sync complete ({synced} visitors)")
            
            # Step 4: Start background sync thread
            if not SYNC_THREAD_RUNNING:
                print("[STEP 4] Starting background sync thread (every 5 minutes)...")
                _start_background_sync()
                SYNC_THREAD_RUNNING = True
                print("[STEP 4] ✓ Background sync thread started")
            
            # Step 5: Start doorbell event listener
            print("[STEP 5] Starting real-time doorbell event listener...")
            def listen_doorbell_async():
                """Run doorbell listener in background thread"""
                try:
                    firebase_sync.listen_to_doorbell_events(recognizer)
                except Exception as e:
                    print(f"[DOORBELL] ✗ Listener error: {e}")
            
            doorbell_thread = Thread(target=listen_doorbell_async, daemon=True)
            doorbell_thread.start()
            print("[STEP 5] ✓ Doorbell listener started")
            
            print("\n" + "="*70)
            print("[SYSTEM] ✓✓✓ System ready! Face recognition active ✓✓✓")
            print("="*70 + "\n")
            
        except Exception as e:
            print(f"\n[ERROR] System initialization failed: {e}")
            print("="*70)
            raise

def _start_background_sync():
    """Run periodic sync in background every 5 minutes"""
    def sync_loop():
        while True:
            try:
                time.sleep(300)  # 5 minutes
                print("\n[BG-SYNC] Time for periodic sync...")
                firebase_sync.sync_new_visitors()
            except Exception as e:
                print(f"[BG-SYNC] ✗ Error: {e}")
    
    thread = Thread(target=sync_loop, daemon=True)
    thread.start()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Face Recognition API running with Firebase Realtime Database",
        "version": "2.0",
        "database": "Firebase Realtime Database"
    })

@app.route('/sync-visitors', methods=['POST'])
def sync_visitors():
    """
    Manually trigger visitor sync from Firebase
    
    JSON Body:
        - type: 'full' (all visitors) or 'new' (only new/updated)
    
    Returns:
        - success: bool
        - synced_count: number of visitors synced
        - syncType: type of sync performed
    """
    try:
        init_system()
        
        # Get sync type from request (default: incremental)
        sync_type = 'new'
        if request.is_json:
            data = request.get_json()
            sync_type = data.get('type', 'new')
        
        if sync_type == 'full':
            print("\n[API] Manual FULL sync requested...")
            synced_count = firebase_sync.sync_all_visitors()
        else:
            print("\n[API] Manual INCREMENTAL sync requested...")
            synced_count = firebase_sync.sync_new_visitors()
        
        return jsonify({
            "success": True,
            "message": f"Synced {synced_count} visitors",
            "synced_count": synced_count,
            "syncType": sync_type,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"[API] ✗ Sync error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to sync visitors"
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """
    Get system status including Firebase sync information
    
    Returns:
        - systemStatus: operational/error
        - database: Firebase Realtime Database
        - syncStatus: last sync info
    """
    try:
        init_system()
        
        # Get Firebase sync status
        try:
            status_ref = firebase_sync.sync_status_ref.get()
            sync_status = status_ref.val() if status_ref.exists() else {}
        except:
            sync_status = {}
        
        return jsonify({
            "success": True,
            "systemStatus": "operational",
            "database": "Firebase Realtime Database",
            "databaseUrl": "https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app",
            "syncStatus": sync_status,
            "recognizerStatus": "loaded" if recognizer is not None else "not_loaded"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "systemStatus": "error",
            "error": str(e)
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Endpoint to recognize faces in an image
    Integrates with Firebase visitor database
    
    Accepts: 
        - JSON with base64 encoded image
        - Multipart form-data with image file
        - Optional eventId to update recognition result
    
    Returns: 
        - faces: list of recognized faces
        - authenticated: boolean
        - recognized_names: list of recognized person names
    """
    try:
        init_system()
        
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
                image_data = base64.b64decode(data['image'])
                nparr = np.frombuffer(image_data, np.uint8)
                # Lazy import OpenCV at runtime
                import cv2
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
                import cv2
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
                "error": "Invalid request format. Send JSON with 'image' or multipart form data",
                "authenticated": False
            }), 400
        
        # Validate image
        if frame is None:
            return jsonify({
                "success": False,
                "error": "Invalid image format. Supported: JPG, PNG, BMP",
                "authenticated": False
            }), 400
        
        # Run face recognition
        print(f"\n[RECOGNIZE] Processing image: {frame.shape}")
        results = recognizer.recognize(frame)
        print(f"[RECOGNIZE] Found {len(results)} face(s)")
        
        # No faces detected
        if len(results) == 0:
            return jsonify({
                "success": True,
                "authenticated": False,
                "message": "No faces detected in image",
                "faces_detected": 0,
                "faces": [],
                "recognized_count": 0,
                "unknown_count": 0,
                "timestamp": datetime.now().isoformat()
            }), 200
        
        # Format results
        faces = []
        recognized_names = []
        
        for result in results:
            # Handle both old format (5 values) and new format (6 values with confidence)
            if len(result) == 6:
                x1, y1, x2, y2, name, confidence = result
            else:
                x1, y1, x2, y2, name = result
                confidence = 0.95 if name != "Unknown" else 0.0
            
            is_recognized = name != "Unknown"
            if is_recognized:
                recognized_names.append(name)
            
            # Get visitor details if recognized
            visitor_info = None
            if is_recognized:
                try:
                    visitor_info = firebase_sync.get_visitor_by_name(name)
                except:
                    pass
            
            faces.append({
                "name": name,
                "recognized": is_recognized,
                "confidence": f"{confidence:.2%}" if is_recognized else "none",
                "confidence_score": float(confidence),
                "bbox": {
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                },
                "visitorInfo": visitor_info if visitor_info else None
            })
        
        # Determine authentication
        recognized_count = len(recognized_names)
        unknown_count = len(results) - recognized_count
        authenticated = recognized_count > 0
        
        # Prepare response
        response = {
            "success": True,
            "authenticated": authenticated,
            "message": f"Authenticated: {', '.join(recognized_names)}" if authenticated else "No recognized faces",
            "faces_detected": len(faces),
            "recognized_count": recognized_count,
            "unknown_count": unknown_count,
            "recognized_names": recognized_names,
            "faces": faces,
            "timestamp": datetime.now().isoformat()
        }
        
        # Update Firebase if eventId provided
        event_id = None
        if request.is_json:
            event_id = request.get_json().get('eventId')
        elif request.args.get('eventId'):
            event_id = request.args.get('eventId')
        
        if event_id and recognized_count > 0:
            try:
                # Get best confidence from all recognized faces
                best_confidence = max(
                    face.get('confidence_score', 0.95) 
                    for face in faces 
                    if face.get('recognized', False)
                )
                
                firebase_sync.update_recognition_result(
                    event_id,
                    recognized_names[0],
                    best_confidence,
                    True   # Authorized
                )
            except Exception as e:
                print(f"[RECOGNIZE] Note: Could not update Firebase - {e}")
        
        print(f"[RECOGNIZE] Response: Auth={authenticated}, Recognized={recognized_count}, Unknown={unknown_count}")
        return jsonify(response), 200
    
    except Exception as e:
        print(f"[RECOGNIZE] ✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "authenticated": False,
            "error": str(e),
            "message": "Internal server error"
        }), 500


@app.route('/doorbell/recognize', methods=['POST'])
def recognize_doorbell_event():
    """Process a doorbell event image and compare against Supabase embeddings."""
    try:
        init_system()

        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Send JSON with base64 image",
            }), 400

        data = request.get_json() or {}
        base64_image = data.get('image') or data.get('imageBase64')
        event_id = data.get('eventId') or data.get('event_id')

        if not base64_image:
            return jsonify({
                "success": False,
                "error": "Field 'image' (base64) is required",
            }), 400

        from src.doorbell_processor import recognize_face_from_doorbell

        result = recognize_face_from_doorbell(base64_image)

        # If dependency missing, return 503 so clients know to retry after install
        if result.get('dependency_missing'):
            return jsonify({
                "success": False,
                "error": result.get('error'),
                "dependency_missing": result.get('dependency_missing'),
                "eventId": event_id,
            }), 503

        response_payload = {"success": True, "eventId": event_id, **result}

        if event_id:
            try:
                firebase_sync.update_recognition_result(
                    event_id,
                    result.get('name', 'Unknown'),
                    result.get('confidence', 0.0),
                    result.get('authorized', False)
                )
            except Exception as sync_err:
                print(f"[DOORBELL] Could not update Firebase for event {event_id}: {sync_err}")
                response_payload["firebaseUpdateError"] = str(sync_err)

        return jsonify(response_payload), 200

    except Exception as e:
        print(f"[DOORBELL] Error processing doorbell event: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to process doorbell event"
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
    Simple authentication endpoint (yes/no response)
    Used by ESP32CAM for quick pass/fail decision
    
    Returns:
        - authenticated: boolean
        - person: name of recognized person or null
    """
    try:
        init_system()
        
        # Get image
        import cv2
        if request.is_json:
            data = request.get_json()
            if 'image' not in data:
                return jsonify({
                    "authenticated": False,
                    "error": "No image provided"
                }), 400
            image_data = base64.b64decode(data['image'])
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        elif 'image' in request.files:
            file = request.files['image']
            file_bytes = np.frombuffer(file.read(), np.uint8)
            frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        else:
            return jsonify({
                "authenticated": False,
                "error": "Invalid request"
            }), 400
        
        if frame is None:
            return jsonify({
                "authenticated": False,
                "error": "Invalid image"
            }), 400
        
        # Run recognition
        results = recognizer.recognize(frame)
        
        # Check if any recognized face
        authenticated = any(name != "Unknown" for (_, _, _, _, name) in results)
        recognized_names = [name for (_, _, _, _, name) in results if name != "Unknown"]
        
        return jsonify({
            "authenticated": authenticated,
            "person": recognized_names[0] if recognized_names else None,
            "all_recognized": recognized_names,
            "faces_count": len(results),
            "timestamp": datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            "authenticated": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*70)
    print("FACE RECOGNITION API SERVER v2.0")
    print("="*70)
    print("\nDatabase: Firebase Realtime Database")
    print("URL: https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app")
    print("\nServer: http://0.0.0.0:5000")
    print("\nAvailable Endpoints:")
    print("  GET  /health               - Health check & system status")
    print("  GET  /status               - Detailed system status with Firebase info")
    print("  POST /recognize            - Full face recognition with details")
    print("  POST /authenticate         - Simple authentication (yes/no)")
    print("  POST /sync-visitors        - Manually trigger visitor sync")
    print("  POST /doorbell/recognize   - Doorbell image match using Supabase embeddings")
    print("\nBackground Processes:")
    print("  • Visitor sync every 5 minutes (automatic)")
    print("  • Models loaded on startup")
    print("="*70)
    print("\nStarting server...")
    print("Press Ctrl+C to stop\n")
    
    try:
        # Lazy initialization: server starts without heavy models
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except Exception as e:
        print(f"\n\nError starting server: {e}")
        raise

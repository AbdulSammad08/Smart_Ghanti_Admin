"""
Firebase Realtime Database Sync Manager
Handles real-time synchronization of visitors from Firebase
Generates and caches face embeddings locally for fast recognition
"""

import firebase_admin
from firebase_admin import db, credentials
import requests
import numpy as np
import pickle
import os
import json
from datetime import datetime
from .face_encoder import FaceEncoder
from .detector import FaceDetector
from .config import EMBEDDING_DB, EMBEDDING_DIR

class FirebaseSyncManager:
    """
    Manages synchronization between Firebase Realtime Database and local embeddings cache
    """
    
    def __init__(self, firebase_credentials_path):
        """
        Initialize Firebase connection
        
        Args:
            firebase_credentials_path: Path to firebase-service-account.json
        """
        # Initialize Firebase only once
        if not firebase_admin.get_app():
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app'
            })
        
        self.db = db.reference()
        self.encoder = FaceEncoder()
        self.detector = FaceDetector()
        
        # Firebase references
        self.visitors_ref = self.db.child('visitors')
        self.doorbell_events_ref = self.db.child('doorbell_events')
        self.recognition_results_ref = self.db.child('recognition_results')
        self.sync_status_ref = self.db.child('faceRecognition').child('syncStatus')
        self.config_ref = self.db.child('faceRecognition').child('config')
        
        print("[Firebase] ✓ Connected to Realtime Database")
    
    def get_all_visitors(self):
        """
        Fetch all visitors from Firebase Realtime Database
        
        Returns:
            dict: All visitors or empty dict if none exist
        """
        try:
            visitors_snapshot = self.visitors_ref.get()
            if visitors_snapshot.exists():
                return visitors_snapshot.val()
            return {}
        except Exception as e:
            print(f"[Firebase] ✗ Error fetching visitors: {e}")
            return {}
    
    def get_active_visitors(self):
        """
        Get only ACTIVE visitors (exclude blocked/removed)
        
        Returns:
            dict: Active visitors only
        """
        try:
            all_visitors = self.get_all_visitors()
            active = {
                vid: vdata for vid, vdata in all_visitors.items()
                if vdata.get('status') == 'active'
            }
            return active
        except Exception as e:
            print(f"[Firebase] ✗ Error filtering visitors: {e}")
            return {}
    
    def get_new_visitors(self):
        """
        Get visitors that are NEW or UPDATED since last sync
        This enables incremental updates without processing everything
        
        Returns:
            dict: New or updated visitors
        """
        try:
            visitors = self.get_active_visitors()
            last_sync = self._get_last_sync_time()
            
            new_visitors = {}
            for visitor_id, visitor_data in visitors.items():
                created_at = visitor_data.get('createdAt', 0)
                updated_at = visitor_data.get('updatedAt', created_at)
                last_synced = visitor_data.get('lastSyncedForFaceRecognition', 0)
                
                # Include if: never synced OR updated after last sync
                if last_synced == 0 or updated_at > last_sync:
                    new_visitors[visitor_id] = visitor_data
            
            return new_visitors
        except Exception as e:
            print(f"[Firebase] ✗ Error getting new visitors: {e}")
            return {}
    
    def sync_all_visitors(self):
        """
        FULL SYNC: Process ALL visitors and regenerate embeddings
        Use this on API startup or for complete refresh
        
        Returns:
            int: Number of visitors successfully synced
        """
        print("\n" + "="*60)
        print("[SYNC] Starting FULL visitor sync from Firebase...")
        print("="*60)
        
        visitors = self.get_active_visitors()
        
        if not visitors:
            print("[SYNC] ✗ No active visitors found in Firebase")
            print("="*60)
            return 0
        
        db = self._load_embeddings_db()
        synced_count = 0
        failed_count = 0
        
        print(f"[SYNC] Processing {len(visitors)} visitors...")
        print("-"*60)
        
        for visitor_id, visitor_data in visitors.items():
            result = self._process_visitor(visitor_id, visitor_data, db)
            if result:
                synced_count += 1
            else:
                failed_count += 1
        
        # Save updated embeddings
        self._save_embeddings_db(db)
        self._update_sync_status(synced_count, len(visitors))
        
        print("-"*60)
        print(f"[SYNC] ✓ Complete!")
        print(f"[SYNC]   Synced: {synced_count}/{len(visitors)}")
        print(f"[SYNC]   Failed: {failed_count}")
        print(f"[SYNC]   Total in cache: {len(db)}")
        print("="*60 + "\n")
        
        return synced_count
    
    def sync_new_visitors(self):
        """
        INCREMENTAL SYNC: Only process NEW or UPDATED visitors
        Use this periodically (every 5-10 minutes) for efficiency
        
        Returns:
            int: Number of new/updated visitors synced
        """
        print("\n[BG-SYNC] Checking for new/updated visitors...")
        
        new_visitors = self.get_new_visitors()
        
        if not new_visitors:
            print("[BG-SYNC] ✓ No new visitors to sync")
            return 0
        
        db = self._load_embeddings_db()
        synced_count = 0
        
        print(f"[BG-SYNC] Found {len(new_visitors)} new/updated visitor(s)")
        
        for visitor_id, visitor_data in new_visitors.items():
            if self._process_visitor(visitor_id, visitor_data, db):
                synced_count += 1
        
        # Save updated embeddings
        self._save_embeddings_db(db)
        self._update_sync_status(synced_count, len(self.get_active_visitors()))
        
        print(f"[BG-SYNC] ✓ Synced {synced_count} new visitor(s)\n")
        return synced_count
    
    def _process_visitor(self, visitor_id, visitor_data, db):
        """
        Process a single visitor: download images, generate embeddings, cache
        
        Args:
            visitor_id: Unique visitor ID
            visitor_data: Visitor data from Firebase
            db: Embeddings database dictionary
            
        Returns:
            bool: True if successful, False otherwise
        """
        name = visitor_data.get('name', visitor_id)
        status = visitor_data.get('status', 'active')
        image_urls = visitor_data.get('imageUrls', {})
        
        # Validation
        if status != 'active':
            print(f"  ⊘ {name}: Skipped (status: {status})")
            return False
        
        if not image_urls:
            print(f"  ⚠ {name}: No images found")
            return False
        
        print(f"  ➤ Processing: {name}")
        embeddings = []
        
        # Convert Firebase structure (object) to list
        if isinstance(image_urls, dict):
            urls = list(image_urls.values())
        else:
            urls = image_urls if isinstance(image_urls, list) else []
        
        if not urls:
            print(f"    ✗ Invalid image URLs structure")
            return False
        
        # Download and encode each image
        for idx, image_url in enumerate(urls, 1):
            try:
                # Download image
                img = self._download_image(image_url)
                if img is None:
                    print(f"    ✗ Image {idx}/{len(urls)}: Failed to download")
                    continue
                
                # Detect face
                boxes = self.detector.detect(img)
                if not boxes:
                    print(f"    ✗ Image {idx}/{len(urls)}: No face detected")
                    continue
                
                # Extract and encode face
                x1, y1, x2, y2 = boxes[0]
                face = img[y1:y2, x1:x2]
                
                if face.size == 0:
                    print(f"    ✗ Image {idx}/{len(urls)}: Invalid face region")
                    continue
                
                embedding = self.encoder.encode(face)
                embeddings.append(embedding)
                print(f"    ✓ Image {idx}/{len(urls)}: Encoded")
                
            except Exception as e:
                print(f"    ✗ Image {idx}/{len(urls)}: Error - {str(e)}")
                continue
        
        # Generate average embedding
        if not embeddings:
            print(f"    ✗ {name}: Could not process any images")
            return False
        
        try:
            avg_embedding = np.mean(embeddings, axis=0)
            db[name] = avg_embedding
            
            # Update Firebase with sync timestamp
            self.visitors_ref.child(visitor_id).update({
                'lastSyncedForFaceRecognition': int(datetime.now().timestamp() * 1000)
            })
            
            print(f"    ✓ {name}: Added ({len(embeddings)} images averaged)")
            return True
            
        except Exception as e:
            print(f"    ✗ {name}: Error creating embedding - {str(e)}")
            return False
    
    def _download_image(self, url, timeout=10):
        """
        Download image from Firebase Storage URL
        
        Args:
            url: Image URL from Firebase Storage
            timeout: Request timeout in seconds
            
        Returns:
            np.ndarray: OpenCV image or None if failed
        """
        try:
            import cv2
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            
            img_array = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                return None
            
            return img
        except requests.exceptions.Timeout:
            print(f"      ✗ Timeout downloading image")
            return None
        except Exception as e:
            print(f"      ✗ Download error: {str(e)[:50]}")
            return None
    
    def _load_embeddings_db(self):
        """
        Load existing embeddings database from local cache
        
        Returns:
            dict: Loaded embeddings or empty dict
        """
        if os.path.exists(EMBEDDING_DB):
            try:
                with open(EMBEDDING_DB, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                print(f"[Cache] Warning: Could not load embeddings - {e}")
                return {}
        return {}
    
    def _save_embeddings_db(self, db):
        """
        Save embeddings database to local cache
        
        Args:
            db: Embeddings dictionary to save
        """
        try:
            os.makedirs(EMBEDDING_DIR, exist_ok=True)
            with open(EMBEDDING_DB, 'wb') as f:
                pickle.dump(db, f)
            print(f"[Cache] ✓ Saved {len(db)} embeddings to cache")
        except Exception as e:
            print(f"[Cache] ✗ Error saving embeddings: {e}")
    
    def _get_last_sync_time(self):
        """
        Get timestamp of last successful sync
        
        Returns:
            int: Timestamp in milliseconds or 0
        """
        try:
            status = self.sync_status_ref.get().val()
            if status and 'lastSync' in status:
                return status['lastSync']
        except Exception as e:
            print(f"[Sync-Time] Error reading sync time: {e}")
        
        return 0
    
    def _update_sync_status(self, synced_count, total_visitors):
        """
        Update sync status in Firebase for monitoring
        
        Args:
            synced_count: Number of visitors synced
            total_visitors: Total visitors in system
        """
        try:
            current_time = int(datetime.now().timestamp() * 1000)
            next_sync_time = current_time + (5 * 60 * 1000)  # +5 minutes
            
            self.sync_status_ref.set({
                'lastSync': current_time,
                'lastSyncMessage': f'Synced {synced_count} visitors',
                'totalVisitors': total_visitors,
                'totalSynced': synced_count,
                'pendingSync': max(0, total_visitors - synced_count),
                'status': 'success',
                'nextScheduledSync': next_sync_time
            })
        except Exception as e:
            print(f"[Firebase] Error updating sync status: {e}")
    
    def update_recognition_result(self, event_id, name, confidence, authorized):
        """
        Update recognition result in Firebase after processing
        Called when face is recognized
        
        Args:
            event_id: Doorbell event ID
            name: Recognized person's name
            confidence: Confidence score (0-1)
            authorized: Whether person is authorized
        """
        try:
            result_id = f"result_{event_id}"
            self.db.child('recognition_results').child(result_id).update({
                'name': name,
                'confidence': float(confidence),
                'authorized': authorized,
                'recognized': name != 'Unknown',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'processedBy': 'face_recognition_api'
            })
            print(f"[Recognition] ✓ Updated result for {name}")
        except Exception as e:
            print(f"[Recognition] ✗ Error updating result: {e}")
    
    def get_visitor_by_name(self, name):
        """
        Find visitor record by recognized name
        
        Args:
            name: Person's name
            
        Returns:
            dict: Visitor data or None
        """
        try:
            visitors = self.get_active_visitors()
            for vid, vdata in visitors.items():
                if vdata.get('name') == name:
                    return vdata
            return None
        except Exception as e:
            print(f"[Firebase] Error finding visitor: {e}")
    
    def listen_to_doorbell_events(self, recognizer=None):
        """
        Listen to Firebase /doorbell_events in real-time
        When ESP32 sends an image, automatically process it
        
        Args:
            recognizer: Optional Recognizer instance for Firebase-based recognition
        """
        print("\n[DOORBELL] 👀 Listening to Firebase /doorbell_events...")
        
        def on_doorbell_event(message):
            """Process new doorbell event from ESP32"""
            if not message.data:
                return
            
            event_data = message.data
            event_id = message.path.strip('/')
            
            # Extract image
            base64_image = event_data.get('image') or event_data.get('imageBase64')
            if not base64_image:
                return
            
            timestamp = event_data.get('timestamp', int(datetime.now().timestamp() * 1000))
            
            print(f"\n" + "="*70)
            print(f"[DOORBELL] 🚪 NEW EVENT RECEIVED: {event_id}")
            print(f"[DOORBELL] ⏰ Timestamp: {datetime.fromtimestamp(timestamp/1000).isoformat()}")
            print(f"[DOORBELL] 📸 Image size: {len(base64_image)} bytes")
            print("="*70)
            
            # Process image with recognizer if provided
            if recognizer:
                try:
                    print(f"[DOORBELL] 🔍 Running face recognition...")
                    results = recognizer.recognize_from_base64(base64_image)
                    
                    if results:
                        for (x1, y1, x2, y2, name) in results:
                            is_recognized = name != "Unknown"
                            print(f"[DOORBELL] {'✅' if is_recognized else '❌'} {name} detected at ({x1},{y1}) to ({x2},{y2})")
                        
                        recognized_names = [name for (_, _, _, _, name) in results if name != "Unknown"]
                        authenticated = len(recognized_names) > 0
                        
                        # Write result to Firebase
                        result_id = f"result_{event_id}"
                        self.recognition_results_ref.child(result_id).set({
                            'eventId': event_id,
                            'recognized': authenticated,
                            'names': recognized_names,
                            'faceCount': len(results),
                            'timestamp': timestamp,
                            'processedAt': int(datetime.now().timestamp() * 1000),
                            'authorized': authenticated,
                        })
                        
                        print(f"[DOORBELL] 💾 Result saved to Firebase: {result_id}")
                    else:
                        print(f"[DOORBELL] ℹ️ No faces detected in image")
                        result_id = f"result_{event_id}"
                        self.recognition_results_ref.child(result_id).set({
                            'eventId': event_id,
                            'recognized': False,
                            'names': [],
                            'faceCount': 0,
                            'timestamp': timestamp,
                            'processedAt': int(datetime.now().timestamp() * 1000),
                            'authorized': False,
                            'error': 'No faces detected'
                        })
                
                except Exception as e:
                    print(f"[DOORBELL] ✗ Recognition error: {e}")
                    result_id = f"result_{event_id}"
                    self.recognition_results_ref.child(result_id).set({
                        'eventId': event_id,
                        'recognized': False,
                        'error': str(e),
                        'timestamp': timestamp,
                        'processedAt': int(datetime.now().timestamp() * 1000),
                    })
            else:
                # Just log that event was received
                print(f"[DOORBELL] ℹ️ Event received (no recognizer provided)")
                result_id = f"result_{event_id}"
                self.recognition_results_ref.child(result_id).set({
                    'eventId': event_id,
                    'recognized': False,
                    'timestamp': timestamp,
                    'processedAt': int(datetime.now().timestamp() * 1000),
                    'message': 'Event received by API'
                })
            
            print("="*70 + "\n")
        
        # Start listening
        self.doorbell_events_ref.listen(on_doorbell_event)

            return None

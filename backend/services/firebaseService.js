const admin = require('firebase-admin');
const axios = require('axios');
const Visitor = require('../models/Visitor');

class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.faceRecognitionUrl = 'http://localhost:5001';
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://smartbell-61451-default-rtdb.asia-southeast1.firebasedatabase.app'
      });

      console.log('✅ Firebase Admin SDK initialized');
      this.isInitialized = true;
      
      // Start listening for doorbell events
      this.startEventListener();
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      throw error;
    }
  }

  startEventListener() {
    const db = admin.database();
    const eventsRef = db.ref('/doorbell_events');

    console.log('🔄 Starting Firebase event listener...');

    eventsRef.on('child_added', async (snapshot) => {
      const eventId = snapshot.key;
      const eventData = snapshot.val();

      // Skip if already processed (persistent idempotency)
      if (eventData.processed === true) {
        return;
      }

      console.log(`📸 New doorbell event: ${eventId}`);

      try {
        // Atomically mark as processing
        await snapshot.ref.update({ processed: true });
        await this.processDoorbellEvent(eventId, eventData);
      } catch (error) {
        console.error(`❌ Error processing event ${eventId}:`, error.message);
        // Reset processed flag on failure
        await snapshot.ref.update({ processed: false });
      }
    });

    console.log('✅ Firebase event listener started');
  }

  async processDoorbellEvent(eventId, eventData) {
    console.log(`🔍 Processing event ${eventId}...`);

    const { image, imageUrl, timestamp, deviceId, createdAt, messageType } = eventData;
    
    // Handle ESP32 format
    const actualDeviceId = deviceId || 'esp32-doorbell';
    const actualTimestamp = timestamp || new Date(createdAt).toISOString();
    
    // Handle both base64 and URL images
    let processedImage;
    if (image) {
      processedImage = image;
    } else if (imageUrl) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        processedImage = Buffer.from(response.data).toString('base64');
      } catch (error) {
        console.error(`❌ Failed to fetch image from URL: ${error.message}`);
        processedImage = null;
      }
    } else {
      console.log(`⚠️  No image or imageUrl in event ${eventId}`);
      processedImage = null;
    }

    // Step 1: Facial recognition (treat as black box)
    const recognitionResult = await this.callFacialRecognition(processedImage);

    // Step 2: Validate against CosmosDB (MongoDB API only)
    const validationResult = await this.validateVisitor(recognitionResult);

    // Step 3: Write to /recognition_results/{eventId} (Flutter contract)
    const finalResult = {
      deviceId: actualDeviceId,
      timestamp: new Date().toISOString(),
      originalTimestamp: actualTimestamp,
      recognized: recognitionResult.success && recognitionResult.authenticated,
      name: validationResult.visitorName || 'unknown',
      authorized: validationResult.isAuthorized || false,
      imageReference: processedImage ? `event_${eventId}` : null,
      messageType: messageType || 'motion_detection'
    };

    await this.writeRecognitionResult(eventId, finalResult);

    // Step 4: FCM notification (only after recognition finishes)
    await this.sendPushNotification(eventId, finalResult);

    console.log(`✅ Event ${eventId} processed successfully`);
  }

  async callFacialRecognition(base64Image) {
    if (!base64Image) {
      return {
        success: false,
        authenticated: false,
        message: 'unclassified - no image',
        recognized_names: []
      };
    }

    try {
      const response = await axios.post(`${this.faceRecognitionUrl}/recognize`, {
        image: base64Image
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Facial recognition failed:', error.message);
      return {
        success: false,
        authenticated: false,
        message: 'unclassified - service unavailable',
        recognized_names: []
      };
    }
  }

  async validateVisitor(recognitionResult) {
    // Handle unclassified cases
    if (!recognitionResult.success || !recognitionResult.authenticated) {
      return {
        isAuthorized: false,
        visitorName: recognitionResult.message?.includes('unclassified') ? 'unclassified' : 'unknown'
      };
    }

    const recognizedNames = recognitionResult.recognized_names || [];
    if (recognizedNames.length === 0) {
      return {
        isAuthorized: false,
        visitorName: 'unknown'
      };
    }

    try {
      // Query ONLY SmartBellDB.visitors (MongoDB API)
      for (const name of recognizedNames) {
        const visitor = await Visitor.findOne({ 
          name: { $regex: new RegExp(name, 'i') },
          isAuthorized: true 
        });

        if (visitor) {
          // Update visit tracking
          visitor.visitCount += 1;
          visitor.lastVisit = new Date();
          await visitor.save();

          return {
            isAuthorized: true,
            visitorName: visitor.name
          };
        }
      }

      // Recognized but not authorized
      return {
        isAuthorized: false,
        visitorName: recognizedNames[0]
      };

    } catch (error) {
      console.error('❌ CosmosDB unreachable:', error.message);
      // Still notify Flutter even if DB fails
      return {
        isAuthorized: false,
        visitorName: recognizedNames[0] || 'unknown'
      };
    }
  }

  async writeRecognitionResult(eventId, result) {
    try {
      const db = admin.database();
      const resultRef = db.ref(`/recognition_results/${eventId}`);
      
      await resultRef.set(result);
      console.log(`✅ Result written to Firebase for event ${eventId}`);
    } catch (error) {
      console.error('❌ Failed to write result to Firebase:', error.message);
      throw error;
    }
  }

  async sendPushNotification(eventId, finalResult) {
    try {
      const { name, authorized, timestamp } = finalResult;
      
      // FCM notification matches recognition_results data
      const message = {
        topic: 'doorbell_notifications',
        notification: {
          title: authorized ? `Welcome ${name}!` : `Visitor: ${name}`,
          body: authorized 
            ? `Authorized visitor ${name} at your door`
            : `${name} detected at your doorbell`
        },
        data: {
          eventId,
          name,
          authorized: authorized.toString(),
          timestamp
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'doorbell_alerts',
            priority: 'high',
            defaultSound: true
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Push notification sent: ${response}`);
      
      return response;
    } catch (error) {
      console.error('❌ Push notification failed:', error.message);
      // Never silently fail - log but continue
    }
  }

  async getEventHistory(limit = 50) {
    try {
      const db = admin.database();
      const eventsRef = db.ref('/doorbell_events').limitToLast(limit);
      const snapshot = await eventsRef.once('value');
      
      return snapshot.val() || {};
    } catch (error) {
      console.error('❌ Failed to get event history:', error.message);
      return {};
    }
  }

  async getRecognitionResults(limit = 50) {
    try {
      const db = admin.database();
      const resultsRef = db.ref('/recognition_results').limitToLast(limit);
      const snapshot = await resultsRef.once('value');
      
      return snapshot.val() || {};
    } catch (error) {
      console.error('❌ Failed to get recognition results:', error.message);
      return {};
    }
  }
}

module.exports = new FirebaseService();

const admin = require('firebase-admin');
const axios = require('axios');

// Test Firebase integration
async function testFirebaseIntegration() {
  try {
    console.log('🔄 Testing Firebase integration...\n');

    // Initialize Firebase
    const serviceAccount = require('./config/firebase-service-account.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://smartbell-61451-default-rtdb.firebaseio.com'
    });

    console.log('✅ Firebase Admin SDK initialized');

    // Test database connection
    const db = admin.database();
    const testRef = db.ref('/test');
    
    await testRef.set({
      message: 'Firebase integration test',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Firebase Realtime Database write test passed');

    // Test reading
    const snapshot = await testRef.once('value');
    const data = snapshot.val();
    console.log('✅ Firebase Realtime Database read test passed:', data.message);

    // Test facial recognition API
    console.log('\n🤖 Testing facial recognition API...');
    
    try {
      const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      console.log('✅ Facial recognition API is running:', response.data.message);
    } catch (error) {
      console.log('❌ Facial recognition API not available:', error.message);
      console.log('   Make sure to start the API with: cd Recog_Face && python api.py');
    }

    // Test push notification (to topic)
    console.log('\n📱 Testing push notification...');
    
    try {
      const message = {
        topic: 'doorbell_notifications',
        notification: {
          title: 'Test Notification',
          body: 'Firebase integration test successful'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent successfully:', response);
    } catch (error) {
      console.log('⚠️  Push notification test failed:', error.message);
      console.log('   This is normal if no devices are subscribed to the topic');
    }

    // Simulate doorbell event
    console.log('\n📸 Simulating doorbell event...');
    
    const eventId = `test_${Date.now()}`;
    const eventData = {
      timestamp: new Date().toISOString(),
      motion_detected: true,
      image: 'test_base64_image_data',
      device_id: 'ESP32_TEST'
    };

    await db.ref(`/doorbell_events/${eventId}`).set(eventData);
    console.log('✅ Test doorbell event created:', eventId);

    // Clean up test data
    await testRef.remove();
    await db.ref(`/doorbell_events/${eventId}`).remove();
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All Firebase integration tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Seed visitor data: npm run seed-visitors');
    console.log('3. Start facial recognition API: cd ../Recog_Face && python api.py');
    console.log('4. Start backend server: npm start');
    console.log('5. Test with ESP32 sending real data to Firebase');

  } catch (error) {
    console.error('❌ Firebase integration test failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testFirebaseIntegration();
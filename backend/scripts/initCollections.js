const mongoose = require('mongoose');
require('dotenv').config();

const initCollections = async () => {
  try {
    console.log('Connecting to SmartBellDB in Azure Cosmos DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    
    // List existing databases
    console.log('Checking existing databases...');
    
    try {
      // Try to create database by inserting a document
      console.log('Creating/accessing database and collection...');
      
      // Insert a test document to create database and collection
      const testDoc = {
        name: 'Test Plan - Will be deleted',
        price: 0,
        duration: 'monthly',
        features: ['Test'],
        maxDevices: 1,
        maxSecondaryUsers: 0,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _temp: true
      };
      
      await db.collection('subscriptions').insertOne(testDoc);
      console.log('Database and collection created successfully!');
      
      // Remove the test document
      await db.collection('subscriptions').deleteOne({ _temp: true });
      console.log('Test document removed');
      
      // Check if we have any real data
      const count = await db.collection('subscriptions').countDocuments();
      console.log(`Current subscription count: ${count}`);
      
      if (count === 0) {
        console.log('Inserting sample subscription plans...');
        const samplePlans = [
          {
            name: 'Basic Plan',
            price: 9.99,
            duration: 'monthly',
            features: ['Live Video Streaming', 'Motion Detection', 'Mobile Notifications'],
            maxDevices: 1,
            maxSecondaryUsers: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: 'Premium Plan',
            price: 19.99,
            duration: 'monthly',
            features: ['All Basic Features', 'Cloud Storage (30 days)', 'Two-way Audio', 'Smart Alerts'],
            maxDevices: 2,
            maxSecondaryUsers: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        await db.collection('subscriptions').insertMany(samplePlans);
        console.log('Sample subscription plans inserted successfully!');
      }
      
      // Create other collections if needed
      console.log('Creating other required collections...');
      
      // Create user_v2s collection
      await db.collection('user_v2s').insertOne({ _temp: true });
      await db.collection('user_v2s').deleteOne({ _temp: true });
      console.log('User_v2s collection ready');
      
      // Create admins collection
      await db.collection('admins').insertOne({ _temp: true });
      await db.collection('admins').deleteOne({ _temp: true });
      console.log('Admins collection ready');
      
      // Create transfers collection
      await db.collection('transfers').insertOne({ _temp: true });
      await db.collection('transfers').deleteOne({ _temp: true });
      console.log('Transfers collection ready');
      
    } catch (createError) {
      console.error('Error creating collections:', createError.message);
      throw createError;
    }

    console.log('\n✅ SmartBellDB setup completed successfully!');
    console.log('✅ All collections are ready to use');
    console.log('✅ Database: SmartBellDB');
    console.log('✅ You can now create admin and start your application');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database initialization:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

initCollections();
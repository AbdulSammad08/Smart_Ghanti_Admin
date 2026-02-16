const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createCosmosAdmin = async () => {
  try {
    console.log('🔄 Connecting to Azure Cosmos DB...');
    console.log('Database: SmartBellDB');
    console.log('Collection: admins');
    
    // Connect to Azure Cosmos DB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: false
    });
    
    console.log('✅ Connected to Azure Cosmos DB successfully!');
    
    // Admin credentials
    const adminEmail = 'admin@smartbell.com';
    const adminPassword = 'SmartBell2024!';
    
    // Access the SmartBellDB database and admins collection
    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');
    
    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists, updating...');
      await adminsCollection.deleteOne({ email: adminEmail });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create admin document for Cosmos DB
    const adminDoc = {
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0  // Version key for Mongoose compatibility
    };
    
    // Insert admin into Cosmos DB
    const result = await adminsCollection.insertOne(adminDoc);
    
    console.log('\\n🎉 ADMIN USER CREATED IN AZURE COSMOS DB!');
    console.log('==========================================');
    console.log('📧 Email: ' + adminEmail);
    console.log('🔑 Password: ' + adminPassword);
    console.log('🆔 Admin ID: ' + result.insertedId);
    console.log('🏢 Database: SmartBellDB');
    console.log('📁 Collection: admins');
    console.log('✅ Status: Active');
    console.log('==========================================');
    
    // Verify creation
    const verifyAdmin = await adminsCollection.findOne({ _id: result.insertedId });
    if (verifyAdmin) {
      console.log('\\n✅ Admin successfully verified in Azure Cosmos DB');
      console.log('🌐 You can now login at: http://localhost:3000');
    } else {
      console.log('\\n❌ Failed to verify admin creation');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\\n🔧 Azure Cosmos DB Connection Issues:');
      console.log('1. Check your connection string in .env file');
      console.log('2. Verify Azure Cosmos DB account is running');
      console.log('3. Check firewall/network settings');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\\n🔧 Authentication Issues:');
      console.log('1. Verify your Azure Cosmos DB credentials');
      console.log('2. Check if the connection string is correct');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Connection to Azure Cosmos DB closed');
    }
    process.exit(0);
  }
};

createCosmosAdmin();
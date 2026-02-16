const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('Connecting to database...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log('Connected to MongoDB!');
    
    // Admin credentials
    const email = 'admin@smartbell.com';
    const password = 'Admin123!';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin document
    const adminDoc = {
      email: email,
      password: hashedPassword,
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly into admins collection
    const db = mongoose.connection.db;
    
    // Remove existing admin if any
    await db.collection('admins').deleteMany({});
    
    // Insert new admin
    const result = await db.collection('admins').insertOne(adminDoc);
    
    console.log('\\n=== ADMIN USER CREATED ===');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    console.log('Admin ID: ' + result.insertedId);
    console.log('Status: Active');
    console.log('========================\\n');
    
    // Verify the admin was created
    const createdAdmin = await db.collection('admins').findOne({ email: email });
    if (createdAdmin) {
      console.log('✅ Admin verified in database');
    } else {
      console.log('❌ Admin not found after creation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
};

createAdmin();
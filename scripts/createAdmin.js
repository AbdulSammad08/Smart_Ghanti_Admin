const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('Connecting to SmartBellDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');
    
    // Use direct MongoDB operation to avoid Mongoose issues
    const db = mongoose.connection.db;
    
    // Check if admin already exists
    const adminExists = await db.collection('admins').findOne({ email: process.env.ADMIN_EMAIL });
    if (adminExists) {
      console.log('Admin already exists with email:', process.env.ADMIN_EMAIL);
      return;
    }

    // Create admin directly in database
    const adminData = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD, // Will be hashed by the model
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Hash password manually
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    const result = await db.collection('admins').insertOne(adminData);
    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', process.env.ADMIN_EMAIL);
    console.log('🔑 Password:', process.env.ADMIN_PASSWORD);
    console.log('🆔 Admin ID:', result.insertedId);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Full error:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
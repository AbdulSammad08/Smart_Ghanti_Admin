const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createNewAdmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect with longer timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // New admin credentials
    const adminEmail = 'admin@smartbell.com';
    const adminPassword = 'SmartBell2024!';
    
    // Use direct MongoDB operations
    const db = mongoose.connection.db;
    
    // Delete any existing admin with this email
    await db.collection('admins').deleteMany({ email: adminEmail });
    console.log('🗑️  Cleared existing admin records');
    
    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create new admin
    const adminData = {
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('admins').insertOne(adminData);
    
    console.log('\n🎉 NEW ADMIN CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 Admin ID:', result.insertedId);
    console.log('🔐 Role: admin');
    console.log('✅ Status: Active');
    console.log('==========================================');
    console.log('\n💡 Use these credentials to login to your admin panel');
    console.log('🌐 Login URL: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('connection')) {
      console.log('\n🔧 Connection troubleshooting:');
      console.log('1. Check if your MongoDB connection string is correct');
      console.log('2. Verify your internet connection');
      console.log('3. Check if Azure Cosmos DB is accessible');
      console.log('4. Verify firewall settings');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the script
createNewAdmin();
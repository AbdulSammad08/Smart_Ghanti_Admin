const mongoose = require('mongoose');
require('dotenv').config();
const Visitor = require('../models/Visitor');

const sampleVisitors = [
  {
    name: 'Ali',
    email: 'ali@example.com',
    phone: '+92-300-1234567',
    isAuthorized: true,
    notes: 'Regular visitor - family friend',
    addedBy: 'admin@smartbell.com'
  },
  {
    name: 'Azwar',
    email: 'azwar@example.com',
    phone: '+92-301-2345678',
    isAuthorized: true,
    notes: 'Neighbor - authorized access',
    addedBy: 'admin@smartbell.com'
  },
  {
    name: 'Sammad',
    email: 'sammad@example.com',
    phone: '+92-302-3456789',
    isAuthorized: true,
    notes: 'Family member',
    addedBy: 'admin@smartbell.com'
  },
  {
    name: 'Tayab',
    email: 'tayab@example.com',
    phone: '+92-303-4567890',
    isAuthorized: true,
    notes: 'Close friend - regular visits',
    addedBy: 'admin@smartbell.com'
  },
  {
    name: 'Zulqarnain',
    email: 'zulqarnain@example.com',
    phone: '+92-304-5678901',
    isAuthorized: true,
    notes: 'Colleague - authorized visitor',
    addedBy: 'admin@smartbell.com'
  }
];

async function seedVisitors() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: false,
      authSource: 'admin'
    });
    
    console.log('✅ Connected to database');
    
    // Clear existing visitors
    console.log('🗑️  Clearing existing visitors...');
    await Visitor.deleteMany({});
    
    // Insert sample visitors
    console.log('📝 Inserting sample visitors...');
    const insertedVisitors = await Visitor.insertMany(sampleVisitors);
    
    console.log(`✅ Successfully inserted ${insertedVisitors.length} visitors:`);
    insertedVisitors.forEach(visitor => {
      console.log(`   - ${visitor.name} (${visitor.email})`);
    });
    
    console.log('\n🎉 Visitor seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding visitors:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
if (require.main === module) {
  seedVisitors();
}

module.exports = seedVisitors;
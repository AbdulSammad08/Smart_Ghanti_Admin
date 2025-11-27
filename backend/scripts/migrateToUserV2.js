const mongoose = require('mongoose');
require('dotenv').config();

const migrateUsers = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully!');

    const db = mongoose.connection.db;
    
    // Check if old users collection exists and has data
    const oldUsersCount = await db.collection('users').countDocuments();
    console.log(`📊 Found ${oldUsersCount} users in 'users' collection`);
    
    if (oldUsersCount === 0) {
      console.log('⚠️  No users found in old collection. Nothing to migrate.');
      return;
    }
    
    // Check if new collection already has data
    const newUsersCount = await db.collection('users_v2').countDocuments();
    console.log(`📊 Found ${newUsersCount} users in 'users_v2' collection`);
    
    if (newUsersCount > 0) {
      console.log('⚠️  users_v2 collection already has data. Skipping migration.');
      console.log('💡 If you want to re-migrate, please clear users_v2 collection first.');
      return;
    }
    
    // Copy all users from old to new collection
    console.log('🔄 Starting migration...');
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length > 0) {
      await db.collection('users_v2').insertMany(users);
      console.log(`✅ Successfully migrated ${users.length} users to users_v2 collection`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

migrateUsers();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transfer = require('../models/Transfer');
const Subscription = require('../models/Subscription');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // Create sample subscriptions
    const subscriptions = await Subscription.insertMany([
      {
        name: 'Basic Plan',
        price: 9.99,
        duration: 'Monthly',
        features: ['1 Device', 'Basic Support'],
        maxDevices: 1,
        maxSecondaryUsers: 2
      },
      {
        name: 'Premium Plan',
        price: 19.99,
        duration: 'Monthly',
        features: ['3 Devices', 'Priority Support', 'Cloud Storage'],
        maxDevices: 3,
        maxSecondaryUsers: 5
      }
    ]);

    // Create sample users
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        passwordHash: 'password123',
        phone: '+1234567890',
        address: '123 Main St, City',
        status: 'Active',
        subscriptionId: subscriptions[0]._id,
        secondaryUsers: [
          { name: 'Jane Doe', email: 'jane.doe@email.com', relationship: 'Spouse' },
          { name: 'Bob Doe', email: 'bob.doe@email.com', relationship: 'Son' }
        ]
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        passwordHash: 'password123',
        phone: '+1234567891',
        address: '456 Oak Ave, City',
        status: 'Active',
        subscriptionId: subscriptions[1]._id,
        secondaryUsers: [
          { name: 'John Smith', email: 'john.smith@email.com', relationship: 'Husband' }
        ]
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com',
        passwordHash: 'password123',
        phone: '+1234567892',
        address: '789 Pine St, City',
        status: 'Active',
        secondaryUsers: []
      }
    ]);

    // Create sample transfers
    await Transfer.insertMany([
      {
        fromUser: users[0]._id,
        toUser: users[1]._id,
        transferType: 'Full Transfer',
        status: 'Pending'
      },
      {
        fromUser: users[1]._id,
        toUser: users[2]._id,
        transferType: 'Partial Transfer',
        status: 'Completed'
      }
    ]);

    console.log('✅ Sample data created successfully!');
    console.log(`Created ${subscriptions.length} subscriptions`);
    console.log(`Created ${users.length} users`);
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
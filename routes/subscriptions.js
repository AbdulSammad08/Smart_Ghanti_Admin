const express = require('express');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    console.log('Test endpoint called');
    res.json({ message: 'Subscriptions API is working', timestamp: new Date() });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
});

// Test POST endpoint
router.post('/test', async (req, res) => {
  try {
    console.log('Test POST endpoint called with body:', req.body);
    res.json({ message: 'POST test successful', receivedData: req.body });
  } catch (error) {
    console.error('Test POST error:', error);
    res.status(500).json({ message: 'POST test failed', error: error.message });
  }
});

// Test database save
router.post('/test-db', async (req, res) => {
  try {
    console.log('Testing database save with simple data');
    const testSubscription = new Subscription({
      name: 'Test Plan',
      price: 10,
      duration: 'monthly',
      features: ['Test Feature'],
      maxDevices: 1,
      maxSecondaryUsers: 0
    });
    
    const saved = await testSubscription.save();
    console.log('Test subscription saved:', saved);
    res.json({ message: 'Database test successful', saved });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database test failed', error: error.message });
  }
});

// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all subscriptions');
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const subscriptions = await db.collection('subscriptions').find({}).toArray();
    console.log('Found subscriptions:', subscriptions.length);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create subscription
router.post('/', async (req, res) => {
  try {
    console.log('Received subscription data:', req.body);
    
    // Use direct MongoDB operation to avoid Mongoose overhead
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const subscriptionData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    console.log('Inserting data:', subscriptionData);
    const result = await db.collection('subscriptions').insertOne(subscriptionData);
    console.log('Insert result:', result);
    
    const savedSubscription = await db.collection('subscriptions').findOne({ _id: result.insertedId });
    console.log('Saved subscription:', savedSubscription);
    
    res.status(201).json(savedSubscription);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: error.toString()
    });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating subscription:', req.params.id);
    const mongoose = require('mongoose');
    const { ObjectId } = require('mongodb');
    const db = mongoose.connection.db;
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const result = await db.collection('subscriptions').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const updatedSubscription = await db.collection('subscriptions').findOne({ _id: new ObjectId(req.params.id) });
    console.log('Updated subscription:', updatedSubscription);
    res.json(updatedSubscription);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting subscription:', req.params.id);
    const mongoose = require('mongoose');
    const { ObjectId } = require('mongodb');
    const db = mongoose.connection.db;
    
    const result = await db.collection('subscriptions').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    console.log('Subscription deleted successfully');
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
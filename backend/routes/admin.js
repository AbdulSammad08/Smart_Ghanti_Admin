const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Subscription = require('../models/Subscription');
const Transfer = require('../models/Transfer');
const BeneficialAllotment = require('../models/BeneficialAllotment');
const OwnershipTransfer = require('../models/OwnershipTransfer');
const SecondaryOwnership = require('../models/SecondaryOwnership');
const auth = require('../middleware/auth');
const dbCheck = require('../middleware/dbCheck');

const router = express.Router();

// Dashboard Statistics
router.get('/dashboard/stats', auth, dbCheck, async (req, res) => {
  try {
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const activeBeneficialAllotments = await BeneficialAllotment.countDocuments({ __v: 1 });
    const activeOwnershipTransfers = await OwnershipTransfer.countDocuments({ __v: 1 });
    const activeSecondaryOwnerships = await SecondaryOwnership.countDocuments({ __v: 1 });
    
    const totalUsers = verifiedUsers + activeBeneficialAllotments + activeOwnershipTransfers + activeSecondaryOwnerships;
    
    const pendingBeneficialAllotments = await BeneficialAllotment.countDocuments({ __v: 0 });
    const pendingOwnershipTransfers = await OwnershipTransfer.countDocuments({ __v: 0 });
    const pendingSecondaryOwnerships = await SecondaryOwnership.countDocuments({ __v: 0 });
    
    const pendingRequests = pendingBeneficialAllotments + pendingOwnershipTransfers + pendingSecondaryOwnerships;
    
    const activeSubscriptions = await User.countDocuments({ subscriptionId: { $exists: true } });

    res.json({
      totalUsers,
      activeSubscriptions,
      pendingRequests,
      systemStatus: 'Online'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cloud Database Status Check (No auth required)
router.get('/system/status', async (req, res) => {
  try {
    // Check Azure Cosmos DB connectivity
    const dbReadyState = mongoose.connection.readyState;
    const isConnected = dbReadyState === 1;
    
    if (!isConnected) {
      return res.status(503).json({
        cloudStatus: 'disconnected',
        message: 'MongoDB Connection Disrupted',
        readyState: dbReadyState,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test actual database operation
    await User.findOne().limit(1);
    
    res.json({
      cloudStatus: 'connected',
      message: 'Connected to MongoDB',
      readyState: dbReadyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      cloudStatus: 'disconnected',
      message: 'Not Connected to MongoDB',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Recent Activities
router.get('/dashboard/activities', auth, dbCheck, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentTransfers = await Transfer.find()
      .populate('fromUser toUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [
      ...recentUsers.map(user => ({
        type: 'user_registered',
        message: `New user ${user.name} registered`,
        timestamp: user.createdAt
      })),
      ...recentTransfers.map(transfer => ({
        type: 'transfer_request',
        message: `Transfer request from ${transfer.fromUser?.name} to ${transfer.toUser?.name}`,
        timestamp: transfer.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new admin
router.post('/create-admin', auth, dbCheck, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new Admin({ 
      email, 
      password,
      role: 'admin',
      permissions: ['all'],
      isActive: true
    });
    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all admins
router.get('/admins', auth, dbCheck, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete admin
router.delete('/admins/:id', auth, dbCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.findByIdAndDelete(id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
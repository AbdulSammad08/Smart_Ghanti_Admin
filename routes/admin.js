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

    // Active Subscriptions: count from users_v2 where subscriptionStatus == ACTIVE (case-insensitive)
    const db = mongoose.connection.db;
    const activeSubscriptions = await db.collection('users_v2').countDocuments({
      subscriptionStatus: { $regex: /^active$/i }
    });

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
    const SecondaryOwnership = require('../models/SecondaryOwnership');
    const OwnershipTransfer = require('../models/OwnershipTransfer');
    const BeneficialAllotment = require('../models/BeneficialAllotment');
    const Payment = require('../models/Payment');

    console.log('📋 Fetching recent activities...');

    // Fetch recent records in parallel - use lean() for better performance and avoid sorting issues
    const [recentSecondary, recentTransfers, recentBeneficiaries, recentPayments] = await Promise.all([
      SecondaryOwnership.find().lean().limit(10),
      OwnershipTransfer.find().lean().limit(10),
      BeneficialAllotment.find().lean().limit(10),
      Payment.find().lean().limit(10)
    ]);

    console.log(`📊 Secondary: ${recentSecondary.length}, Transfers: ${recentTransfers.length}, Beneficiaries: ${recentBeneficiaries.length}, Payments: ${recentPayments.length}`);

    const activities = [
      ...recentSecondary.map(item => ({
        type: 'secondary_user',
        message: `Secondary user ${item.secondaryOwnerName} added for ${item.userName}`,
        timestamp: item.updatedAt || item.createdAt || new Date(),
        meta: {
          user: item.userName,
          email: item.userEmail
        }
      })),
      ...recentTransfers.map(item => ({
        type: 'ownership_transfer',
        message: `Ownership transfer from ${item.fromUser || 'Unknown'} to ${item.toUser || 'Unknown'}`,
        timestamp: item.updatedAt || item.createdAt || new Date(),
        meta: {
          status: item.status,
          transferType: item.transferType
        }
      })),
      ...recentBeneficiaries.map(item => ({
        type: 'beneficiary_allotment',
        message: `Beneficiary ${item.beneficiaryName} allotted to ${item.userName}`,
        timestamp: item.updatedAt || item.createdAt || new Date(),
        meta: {
          allotmentType: item.allotmentType,
          share: item.sharePercentage
        }
      })),
      ...recentPayments.map(item => ({
        type: 'payment_proof',
        message: `Payment proof uploaded by ${item.userName} for ${item.planSelected}`,
        timestamp: item.updatedAt || item.createdAt || new Date(),
        meta: {
          billingCycle: item.billingCycle,
          amount: item.finalAmount
        }
      }))
    ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

    console.log(`✅ Returning ${activities.length} activities`);
    res.json(activities);
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
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
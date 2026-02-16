const express = require('express');
const User = require('../models/User');
const Transfer = require('../models/Transfer');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const dbCheck = require('../middleware/dbCheck');

const router = express.Router();

// Test endpoint without auth
router.get('/test', dbCheck, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Check users_v2 collection directly
    const directCount = await db.collection('users_v2').countDocuments();
    const users = await db.collection('users_v2').find({}).limit(2).toArray();
    
    res.json({ 
      message: 'API working', 
      directCount,
      dbName: db.databaseName,
      collection: 'users_v2',
      sampleUsers: users.map(u => ({ name: u.name, email: u.email }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Test endpoint to get users without auth
router.get('/test-data', dbCheck, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Get users directly from users_v2 collection
    const users = await db.collection('users_v2').find({}).limit(5).toArray();
    const usersData = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      secondaryUsers: user.secondaryUsers ? user.secondaryUsers.length : 0
    }));
    
    res.json({ 
      users: usersData,
      totalCount: users.length,
      currentCollection: 'users_v2'
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Get all users with aggregated data
router.get('/', auth, dbCheck, async (req, res) => {
  console.log('Users API called, admin:', req.admin?.email);
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const SecondaryOwnership = require('../models/SecondaryOwnership');
    const OwnershipTransfer = require('../models/OwnershipTransfer');
    const BeneficialAllotment = require('../models/BeneficialAllotment');
    
    // Get users directly from users_v2 collection
    const users = await db.collection('users_v2').find({}).toArray();
    console.log('Found users from users_v2:', users.length);
    
    // Fetch counts for each user
    const usersWithData = await Promise.all(users.map(async (user) => {
      const userId = new mongoose.Types.ObjectId(user._id); // ensure ObjectId for all queries
      
      // Count secondary ownerships for this user
      const secondaryOwnershipsCount = await SecondaryOwnership.countDocuments({ userId });
      
      // Count ownership transfers for this user
      const ownershipTransfersCount = await OwnershipTransfer.countDocuments({ userId });
      
      // Count beneficial allotments for this user
      const beneficialAllotmentsCount = await BeneficialAllotment.countDocuments({ userId });
      
      console.log(`📊 User: ${user.name}, SecondaryOwnership: ${secondaryOwnershipsCount}, OwnershipTransfers: ${ownershipTransfersCount}, BeneficialAllotments: ${beneficialAllotmentsCount}`);
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified || false,
        status: user.status || 'Active',
        secondaryUsersCount: secondaryOwnershipsCount,
        secondaryOwnershipCount: secondaryOwnershipsCount,
        beneficiaryAllotmentCount: beneficialAllotmentsCount,
        ownershipTransferCount: ownershipTransfersCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        subscriptionStatus: user.subscriptionStatus && user.subscriptionStatus.trim() ? 
          user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1).toLowerCase() : 'None',
        subscriptionPlan: user.subscriptionPlan || 'None',
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate
      };
    }));
    
    console.log('Processed users data:', usersWithData.length);

    res.json({
      users: usersWithData,
      totalPages: 1,
      currentPage: 1,
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, dbCheck, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('subscriptionId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details with related data
router.get('/:id/details', auth, dbCheck, async (req, res) => {
  try {
    console.log('📋 Fetching user details for ID:', req.params.id);
    const mongoose = require('mongoose');
    const SecondaryOwnership = require('../models/SecondaryOwnership');
    const OwnershipTransfer = require('../models/OwnershipTransfer');
    const BeneficialAllotment = require('../models/BeneficialAllotment');
    
    const db = mongoose.connection.db;
    
    // Get user directly from users_v2 collection with subscription data
    const user = await db.collection('users_v2').findOne({ 
      _id: new mongoose.Types.ObjectId(req.params.id) 
    });
    
    console.log('👤 User found:', user ? user.name : 'Not found');
    console.log('📦 Subscription data:', {
      status: user?.subscriptionStatus,
      plan: user?.subscriptionPlan,
      startDate: user?.subscriptionStartDate,
      endDate: user?.subscriptionEndDate
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build subscription object from user's subscription fields
    const subscriptionStatus = user.subscriptionStatus && user.subscriptionStatus.trim() ? 
      user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1).toLowerCase() : 'None';
    
    const activeSubscription = {
      status: subscriptionStatus,
      plan: user.subscriptionPlan || 'None',
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      isActive: user.subscriptionStatus && 
                user.subscriptionStatus.toLowerCase() === 'active' && 
                user.subscriptionEndDate && 
                new Date(user.subscriptionEndDate) > new Date()
    };
    
    console.log('✅ Active subscription object:', activeSubscription);

    // Get related data
    const secondaryOwnerships = await SecondaryOwnership.find({ userId: req.params.id });
    const ownershipTransfers = await OwnershipTransfer.find({ userId: req.params.id });
    const beneficialAllotments = await BeneficialAllotment.find({ userId: req.params.id });

    res.json({
      user,
      activeSubscription,
      secondaryOwnerships,
      ownershipTransfers,
      beneficialAllotments
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/:id', auth, dbCheck, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/:id', auth, dbCheck, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const BeneficialAllotment = require('../models/BeneficialAllotment');
const OwnershipTransfer = require('../models/OwnershipTransfer');
const SecondaryOwnership = require('../models/SecondaryOwnership');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Test route to check collections
router.get('/test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const beneficialCount = await db.collection('beneficialallotments').countDocuments();
    const ownershipCount = await db.collection('ownershiptransfers').countDocuments();
    const secondaryCount = await db.collection('secondaryownerships').countDocuments();
    
    res.json({
      collections: collectionNames,
      counts: {
        beneficialallotments: beneficialCount,
        ownershiptransfers: ownershipCount,
        secondaryownerships: secondaryCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all beneficial allotments
router.get('/beneficial-allotments', auth, async (req, res) => {
  try {
    console.log('Fetching beneficial allotments...');
    const db = mongoose.connection.db;
    const allotments = await db.collection('beneficialallotments').find({}).toArray();
    console.log('Found allotments:', allotments.length);
    res.json(allotments);
  } catch (error) {
    console.error('Error fetching beneficial allotments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all ownership transfers
router.get('/ownership-transfers', auth, async (req, res) => {
  try {
    console.log('Fetching ownership transfers...');
    const db = mongoose.connection.db;
    const transfers = await db.collection('ownershiptransfers').find({}).toArray();
    console.log('Found transfers:', transfers.length);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching ownership transfers:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all secondary ownerships
router.get('/secondary-ownerships', auth, async (req, res) => {
  try {
    console.log('Fetching secondary ownerships...');
    const db = mongoose.connection.db;
    const ownerships = await db.collection('secondaryownerships').find({}).toArray();
    console.log('Found ownerships:', ownerships.length);
    res.json(ownerships);
  } catch (error) {
    console.error('Error fetching secondary ownerships:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update beneficial allotment status
router.patch('/beneficial-allotments/:id/status', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'confirm' or 'reject'
    const __v = action === 'confirm' ? 1 : 0;
    
    const allotment = await BeneficialAllotment.findByIdAndUpdate(
      req.params.id,
      { __v },
      { new: true }
    );
    
    if (!allotment) {
      return res.status(404).json({ message: 'Beneficial allotment not found' });
    }
    
    res.json(allotment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ownership transfer status
router.patch('/ownership-transfers/:id/status', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'confirm' or 'reject'
    const __v = action === 'confirm' ? 1 : 0;
    
    const transfer = await OwnershipTransfer.findByIdAndUpdate(
      req.params.id,
      { __v },
      { new: true }
    );
    
    if (!transfer) {
      return res.status(404).json({ message: 'Ownership transfer not found' });
    }
    
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update secondary ownership status
router.patch('/secondary-ownerships/:id/status', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'confirm' or 'reject'
    const __v = action === 'confirm' ? 1 : 0;
    
    const ownership = await SecondaryOwnership.findByIdAndUpdate(
      req.params.id,
      { __v },
      { new: true }
    );
    
    if (!ownership) {
      return res.status(404).json({ message: 'Secondary ownership not found' });
    }
    
    res.json(ownership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
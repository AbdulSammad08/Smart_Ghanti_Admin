const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const path = require('path');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const db = mongoose.connection.db;
    const payments = await db.collection('payments').find({}).toArray();
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get active subscriptions
router.get('/active', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const activePayments = await db.collection('payments').find({ __v: 1 }).toArray();
    res.json(activePayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { action } = req.body;
    const __v = action === 'confirm' ? 1 : 0;
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { __v },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve receipt files
router.get('/receipt/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', 'receipts', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Receipt file not found' });
    }
  });
});

module.exports = router;
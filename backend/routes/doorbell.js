const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');

// Get doorbell event history
router.get('/events', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await firebaseService.getEventHistory(limit);
    
    res.json({
      success: true,
      events,
      count: Object.keys(events).length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// Get recognition results
router.get('/results', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const results = await firebaseService.getRecognitionResults(limit);
    
    res.json({
      success: true,
      results,
      count: Object.keys(results).length
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});

// Get all visitors
router.get('/visitors', auth, async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      visitors,
      count: visitors.length
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitors',
      error: error.message
    });
  }
});

// Add new visitor
router.post('/visitors', auth, async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Visitor name is required'
      });
    }

    // Check if visitor already exists
    const existingVisitor = await Visitor.findOne({ 
      name: { $regex: new RegExp(name, 'i') }
    });

    if (existingVisitor) {
      return res.status(400).json({
        success: false,
        message: 'Visitor with this name already exists'
      });
    }

    const visitor = new Visitor({
      name,
      email,
      phone,
      notes,
      isAuthorized: true,
      addedBy: req.admin.email
    });

    await visitor.save();

    res.status(201).json({
      success: true,
      message: 'Visitor added successfully',
      visitor
    });
  } catch (error) {
    console.error('Error adding visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add visitor',
      error: error.message
    });
  }
});

// Update visitor
router.put('/visitors/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, notes, isAuthorized } = req.body;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    // Update fields
    if (name) visitor.name = name;
    if (email !== undefined) visitor.email = email;
    if (phone !== undefined) visitor.phone = phone;
    if (notes !== undefined) visitor.notes = notes;
    if (isAuthorized !== undefined) visitor.isAuthorized = isAuthorized;

    await visitor.save();

    res.json({
      success: true,
      message: 'Visitor updated successfully',
      visitor
    });
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update visitor',
      error: error.message
    });
  }
});

// Delete visitor
router.delete('/visitors/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    await Visitor.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Visitor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete visitor',
      error: error.message
    });
  }
});

// Get system status
router.get('/status', auth, async (req, res) => {
  try {
    const visitorCount = await Visitor.countDocuments();
    const authorizedCount = await Visitor.countDocuments({ isAuthorized: true });
    
    res.json({
      success: true,
      status: {
        firebaseConnected: firebaseService.isInitialized,
        totalVisitors: visitorCount,
        authorizedVisitors: authorizedCount,
        faceRecognitionUrl: firebaseService.faceRecognitionUrl,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

module.exports = router;
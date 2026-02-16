const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const router = express.Router();

// Database-based Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);
    
    // Check database connection
    const dbState = require('mongoose').connection.readyState;
    console.log('🔗 Database state:', dbState);
    
    if (dbState !== 1) {
      console.log('❌ Database not connected, state:', dbState);
      return res.status(503).json({ 
        message: 'Database not connected',
        error: 'Please wait for database connection to be established'
      });
    }
    
    // Test database connectivity
    try {
      await require('mongoose').connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.log('❌ Database ping failed:', pingError.message);
      return res.status(503).json({ 
        message: 'Database connection unstable',
        error: 'Please try again in a moment'
      });
    }
    
    // Find admin by email with timeout
    console.log('🔍 Searching for admin:', email);
    const admin = await Admin.findOne({ email }).maxTimeMS(10000);
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }
    console.log('✅ Admin found:', admin.email);
    
    // Check if admin is active
    if (!admin.isActive) {
      console.log('Admin account is inactive:', email);
      return res.status(401).json({ message: 'Account is inactive' });
    }
    
    // Compare password
    console.log('🔑 Verifying password for:', email);
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }
    console.log('✅ Password verified for:', email);
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🎉 Login successful for:', email);
    console.log('🎫 Token generated and sent');
    
    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('buffering') || error.message.includes('initial connection')) {
      return res.status(503).json({ 
        message: 'Database connection not ready',
        error: 'Please wait a moment and try again'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Verify Token
router.get('/admin/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check database connection
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token verification failed' });
  }
});

// Admin Logout
router.post('/admin/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
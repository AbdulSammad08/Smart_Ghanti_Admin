const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working', env: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
});

// Admin Login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received:', { email, password });
  
  if (email === 'admin@example.com' && password === 'admin123') {
    console.log('Login successful');
    const token = jwt.sign({ id: 'admin123' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({
      token,
      admin: {
        id: 'admin123',
        email: email,
        role: 'admin'
      }
    });
  }

  console.log('Login failed');
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Verify Token
router.get('/admin/verify', auth, (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      role: req.admin.role
    }
  });
});

// Admin Logout
router.post('/admin/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
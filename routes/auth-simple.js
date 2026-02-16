const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Simple Admin Login
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

module.exports = router;
const mongoose = require('mongoose');

const dbCheck = (req, res, next) => {
  const dbState = mongoose.connection.readyState;
  
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (dbState !== 1) {
    return res.status(503).json({
      message: 'Database not available',
      error: 'MongoDB connection is not established',
      dbState: {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      }[dbState] || 'unknown'
    });
  }
  
  next();
};

module.exports = dbCheck;
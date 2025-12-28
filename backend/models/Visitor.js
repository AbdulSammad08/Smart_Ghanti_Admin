const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  isAuthorized: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: String,
    default: 'admin'
  },
  notes: {
    type: String,
    trim: true
  },
  lastVisit: {
    type: Date
  },
  visitCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster searches
visitorSchema.index({ name: 1 });
visitorSchema.index({ isAuthorized: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
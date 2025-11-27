const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otpHash: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOtpRequest: Date,
  resetOtpHash: String,
  resetOtpExpires: Date,
  phone: String,
  address: String,
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  lastLogin: Date,
  deviceId: String,
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  secondaryUsers: [{
    name: String,
    email: String,
    relationship: String,
    addedDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'users_v2'
});

module.exports = mongoose.model('User_v2', userSchema);
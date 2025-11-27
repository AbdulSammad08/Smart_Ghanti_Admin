const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxDevices: {
    type: Number,
    default: 1
  },
  maxSecondaryUsers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Prevent automatic index creation that causes throughput issues
subscriptionSchema.set('autoIndex', false);

module.exports = mongoose.model('Subscription', subscriptionSchema);
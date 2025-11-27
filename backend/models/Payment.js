const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  receiptFile: {
    type: String,
    required: true
  },
  planSelected: {
    type: String,
    required: true
  },
  billingCycle: {
    type: String,
    required: true
  },
  finalAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
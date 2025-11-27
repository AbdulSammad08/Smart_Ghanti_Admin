const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User_v2'
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User_v2'
  },
  transferType: {
    type: String,
    enum: ['Full Transfer', 'Partial Transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  completedDate: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Transfer', transferSchema);
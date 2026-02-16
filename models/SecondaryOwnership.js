const mongoose = require('mongoose');

const secondaryOwnershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User_v2',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  secondaryOwnerName: {
    type: String,
    required: true
  },
  ownershipPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  relationshipType: {
    type: String,
    required: true
  },
  documentNumber: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

module.exports = mongoose.model('SecondaryOwnership', secondaryOwnershipSchema, 'secondaryownerships');
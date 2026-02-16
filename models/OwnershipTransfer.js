const mongoose = require('mongoose');

const ownershipTransferSchema = new mongoose.Schema({
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
  currentOwner: {
    type: String,
    required: true
  },
  newOwner: {
    type: String,
    required: true
  },
  propertyAddress: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

module.exports = mongoose.model('OwnershipTransfer', ownershipTransferSchema, 'ownershiptransfers');
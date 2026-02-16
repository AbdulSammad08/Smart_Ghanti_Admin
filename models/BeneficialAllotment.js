const mongoose = require('mongoose');

const beneficialAllotmentSchema = new mongoose.Schema({
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
  beneficiaryName: {
    type: String,
    required: true
  },
  allotmentType: {
    type: String,
    enum: ['Full', 'Partial'],
    required: true
  },
  sharePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  effectiveDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

module.exports = mongoose.model('BeneficialAllotment', beneficialAllotmentSchema, 'beneficialallotments');
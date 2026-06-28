const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: { type: String, required: true }, // UID of person who referred
  referredId: { type: String, required: true }, // UID of person who was referred
  referredPhone: { type: String, required: true },
  commissionAmount: { type: Number, default: 0 },
  depositAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Referral', referralSchema);
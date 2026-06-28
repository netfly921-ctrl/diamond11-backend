const mongoose = require('mongoose');

const giftCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  bonusAmount: { type: Number, required: true },
  bonusType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  maxUsage: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ uid: String, usedAt: Date }],
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  minDeposit: { type: Number, default: 0 },
  description: { type: String, default: '' },
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiftCode', giftCodeSchema);
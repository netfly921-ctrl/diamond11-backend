const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  bonusType: { type: String, enum: ['fixed', 'percentage'], required: true },
  bonusAmount: { type: Number, required: true },
  minDeposit: { type: Number, default: 0 },
  maxBonus: { type: Number, default: 10000 },
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ uid: String, usedAt: Date }],
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Coupon', couponSchema);
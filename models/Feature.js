const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  icon: { type: String, default: 'FaGift' },
  route: { type: String, default: '#' },
  color: { type: String, default: 'text-pink-400' },
  bgColor: { type: String, default: 'bg-pink-500/20' },
  isEnabled: { type: Boolean, default: false },
  isComingSoon: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feature', featureSchema);
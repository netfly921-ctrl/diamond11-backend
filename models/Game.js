const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, default: 'casino' },
  image: { type: String, default: '' },
  path: { type: String, required: true },
  icon: { type: String, default: '🎮' },
  gradient: { type: String, default: 'from-purple-500 to-pink-500' },
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  minBet: { type: Number, default: 10 },
  maxBet: { type: Number, default: 10000 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
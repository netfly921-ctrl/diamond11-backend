const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, default: 'Popular' },
  image: { type: String, default: '' },
  gameUrl: { type: String, default: '' },
  path: { type: String, default: '' },
  icon: { type: String, default: '🎮' },
  isActive: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  minBet: { type: Number, default: 10 },
  maxBet: { type: Number, default: 10000 },
  winPercentage: { type: Number, default: 30 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
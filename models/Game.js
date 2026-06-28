const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, default: 'Popular' },
  isActive: { type: Boolean, default: true },
  minBet: { type: Number, default: 10 },
  maxBet: { type: Number, default: 10000 },
  winPercentage: { type: Number, default: 40 }, 
  isManualActive: { type: Boolean, default: false },
  manualResult: { type: String, enum: ['win', 'loss', 'none'], default: 'none' },
  image: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  gameUrl: { type: String, required: true }
});

module.exports = mongoose.model('Game', gameSchema);
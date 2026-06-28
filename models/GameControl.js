const mongoose = require('mongoose');

const gameControlSchema = new mongoose.Schema({
  gameCode: { type: String, required: true, unique: true },
  gameName: { type: String, required: true },
  
  // Visual
  bannerImage: { type: String, default: '' },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Win/Loss Control
  winPercentage: { type: Number, default: 50 },
  
  // Manual Result Control
  nextRoundResult: { type: String, enum: ['auto', 'win', 'loss'], default: 'auto' },
  forcedMultiplier: { type: Number, default: null },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameControl', gameControlSchema);
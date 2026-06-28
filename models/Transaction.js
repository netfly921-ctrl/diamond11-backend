const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  uid: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdraw', 'game_win', 'game_loss', 'bonus', 'commission', 'refund'], 
    required: true 
  },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 },
  gameCode: { type: String, default: '' },
  gameId: { type: String, default: '' },
  betAmount: { type: Number, default: 0 },
  winAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'rejected'], 
    default: 'success' 
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
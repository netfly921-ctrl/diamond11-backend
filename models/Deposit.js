const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  uid: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  upiId: { type: String, required: true },
  transactionId: { type: String, required: true },
  screenshot: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remark: { type: String, default: '' },
  processedBy: { type: String, default: '' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deposit', depositSchema);
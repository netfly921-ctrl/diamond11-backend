const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  uid: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  upiId: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remark: { type: String, default: '' },
  processedBy: { type: String, default: '' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdraw', withdrawSchema);
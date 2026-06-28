const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdraw = require('../models/Withdraw');
const { verifyToken } = require('../middleware/auth');

router.get('/balance', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('balance bonusBalance');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/deposit', verifyToken, async (req, res) => {
  try {
    const { amount, method, transactionId } = req.body;
    const user = await User.findById(req.userId);
    
    const balanceBefore = user.balance;
    user.balance += parseFloat(amount);
    user.totalDeposit += parseFloat(amount);
    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'deposit',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: user.balance,
      remark: `Deposit via ${method}`,
      status: 'success'
    }).save();

    res.json({ success: true, message: 'Deposit successful', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/withdraw', verifyToken, async (req, res) => {
  try {
    const { amount, accountName, accountNumber, ifsc, upiId, method } = req.body;
    const user = await User.findById(req.userId);

    if (user.balance < parseFloat(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const withdraw = new Withdraw({
      userId: user._id,
      uid: user.uid,
      phone: user.phone,
      amount: parseFloat(amount),
      accountName,
      accountNumber,
      ifsc: ifsc || '',
      upiId: upiId || '',
      status: 'pending'
    });

    await withdraw.save();

    res.json({ success: true, message: 'Withdraw request submitted successfully', withdrawId: withdraw._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { userId: req.userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/withdraw-history', verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
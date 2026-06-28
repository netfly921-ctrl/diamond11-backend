const express = require('express');
const router = express.Router();
const Withdraw = require('../models/Withdraw');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// User: Create withdraw request (DEDUCT BALANCE IMMEDIATELY)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { amount, accountName, accountNumber, ifsc, upiId } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const withdrawAmount = parseFloat(amount);
    if (user.balance < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // ✅ DEDUCT BALANCE IMMEDIATELY
    const balanceBefore = user.balance;
    user.balance -= withdrawAmount;
    await user.save();

    // Create withdraw request with status pending
    const withdraw = new Withdraw({
      userId: user._id,
      uid: user.uid,
      phone: user.phone,
      amount: withdrawAmount,
      accountName,
      accountNumber,
      ifsc,
      upiId: upiId || '',
      status: 'pending',
      balanceBefore,
      balanceAfter: user.balance
    });

    await withdraw.save();

    // Create transaction record
    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'withdraw',
      amount: withdrawAmount,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'pending',
      remark: 'Withdrawal request created'
    }).save();

    res.json({ 
      success: true, 
      message: 'Withdraw request submitted successfully. Amount deducted from balance.',
      withdrawId: withdraw._id,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User: Get own withdraw history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all withdraw requests
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const query = status === 'all' ? {} : { status };
    const withdraws = await Withdraw.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Approve withdraw (BALANCE ALREADY DEDUCTED, just confirm)
router.put('/approve', verifyAdmin, async (req, res) => {
  try {
    const { withdrawId } = req.body;
    
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.status(404).json({ success: false, message: 'Withdraw not found' });

    if (withdraw.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdraw already processed' });
    }

    // Update withdraw status
    withdraw.status = 'approved';
    withdraw.processedBy = req.adminId;
    withdraw.processedAt = new Date();
    await withdraw.save();

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { uid: withdraw.uid, amount: withdraw.amount, type: 'withdraw', status: 'pending' },
      { status: 'success', remark: 'Withdrawal approved by admin' }
    );

    res.json({ success: true, message: 'Withdraw approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Reject withdraw (REFUND BALANCE)
router.put('/reject', verifyAdmin, async (req, res) => {
  try {
    const { withdrawId, remark } = req.body;
    
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.status(404).json({ success: false, message: 'Withdraw not found' });

    if (withdraw.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdraw already processed' });
    }

    // REFUND BALANCE to user
    const user = await User.findOne({ uid: withdraw.uid });
    if (user) {
      const balanceBefore = user.balance;
      user.balance += withdraw.amount;
      user.balanceAfter = user.balance;
      await user.save();

      // Update transaction
      await Transaction.findOneAndUpdate(
        { uid: withdraw.uid, amount: withdraw.amount, type: 'withdraw', status: 'pending' },
        { 
          status: 'failed', 
          remark: `Withdrawal rejected by admin: ${remark || 'No reason provided'}`,
          balanceAfter: user.balance
        }
      );
    }

    // Update withdraw status
    withdraw.status = 'rejected';
    withdraw.remark = remark || 'Rejected by admin';
    withdraw.processedBy = req.adminId;
    withdraw.processedAt = new Date();
    await withdraw.save();

    res.json({ success: true, message: 'Withdraw rejected. Amount refunded to user.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
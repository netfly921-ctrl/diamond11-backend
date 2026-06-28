const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get user cashback info
router.get('/info', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const losses = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'game_loss', createdAt: { $gte: lastWeek } } },
      { $group: { _id: null, totalLoss: { $sum: '$amount' } } }
    ]);

    const totalLoss = losses[0]?.totalLoss || 0;
    const cashbackPercent = 5; // 5% cashback
    const cashbackAmount = Math.floor(totalLoss * cashbackPercent / 100);
    const maxCashback = 1000;
    const finalCashback = Math.min(cashbackAmount, maxCashback);

    res.json({
      success: true,
      data: {
        totalLoss,
        cashbackPercent,
        cashbackAmount: finalCashback,
        canClaim: finalCashback > 0,
        nextClaimDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claim cashback
router.post('/claim', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const losses = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'game_loss', createdAt: { $gte: lastWeek } } },
      { $group: { _id: null, totalLoss: { $sum: '$amount' } } }
    ]);

    const totalLoss = losses[0]?.totalLoss || 0;
    const cashbackAmount = Math.min(Math.floor(totalLoss * 5 / 100), 1000);

    if (cashbackAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No cashback available' });
    }

    const balanceBefore = user.balance;
    user.balance += cashbackAmount;
    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'cashback',
      amount: cashbackAmount,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      remark: `Weekly cashback on loss of ₹${totalLoss}`
    }).save();

    res.json({ success: true, message: `🎉 Cashback ₹${cashbackAmount} claimed!`, cashbackAmount, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
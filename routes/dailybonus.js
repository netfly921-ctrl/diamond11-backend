const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

router.get('/check', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const now = new Date();
    const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    
    if (!lastCheckIn) return res.json({ success: true, canClaim: true, streak: 0 });
    
    const daysDiff = Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return res.json({ success: true, canClaim: false, alreadyClaimed: true, streak: user.checkInStreak });
    if (daysDiff === 1) return res.json({ success: true, canClaim: true, isStreak: true, streak: user.checkInStreak });
    return res.json({ success: true, canClaim: true, isStreak: false, streak: 0 });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/claim', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const bonusConfig = [10, 15, 20, 25, 30, 40, 50, 70, 100, 150];
    const now = new Date();
    const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    
    if (lastCheckIn) {
      const daysDiff = Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) return res.status(400).json({ success: false, message: 'Already claimed today!' });
    }
    
    const streak = lastCheckIn && Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24)) === 1 ? user.checkInStreak + 1 : 1;
    const bonusIndex = Math.min(streak - 1, bonusConfig.length - 1);
    const bonusAmount = bonusConfig[bonusIndex];
    
    const balanceBefore = user.balance;
    user.balance += bonusAmount;
    user.lastCheckIn = now;
    user.checkInStreak = streak;
    user.totalCheckInBonus = (user.totalCheckInBonus || 0) + bonusAmount;
    await user.save();
    
    await new Transaction({ userId: user._id, uid: user.uid, type: 'bonus', amount: bonusAmount, balanceBefore, balanceAfter: user.balance, status: 'success', remark: `Daily check-in - Streak ${streak}` }).save();
    
    res.json({ success: true, message: `🎉 Daily Bonus: ₹${bonusAmount}!`, bonusAmount, streak, nextBonus: bonusConfig[Math.min(streak, bonusConfig.length - 1)] });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
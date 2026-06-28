const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get VIP levels info
router.get('/levels', async (req, res) => {
  try {
    const vipLevels = [
      { level: 1, minExp: 0, withdrawalLimit: 10000, bonusPercent: 0, color: '#9ca3af' },
      { level: 2, minExp: 1000, withdrawalLimit: 20000, bonusPercent: 1, color: '#4ade80' },
      { level: 3, minExp: 5000, withdrawalLimit: 30000, bonusPercent: 2, color: '#60a5fa' },
      { level: 4, minExp: 10000, withdrawalLimit: 50000, bonusPercent: 3, color: '#a78bfa' },
      { level: 5, minExp: 25000, withdrawalLimit: 75000, bonusPercent: 5, color: '#f472b6' },
      { level: 6, minExp: 50000, withdrawalLimit: 100000, bonusPercent: 7, color: '#fb923c' },
      { level: 7, minExp: 100000, withdrawalLimit: 150000, bonusPercent: 10, color: '#f87171' },
      { level: 8, minExp: 250000, withdrawalLimit: 250000, bonusPercent: 12, color: '#dc2626' },
      { level: 9, minExp: 500000, withdrawalLimit: 500000, bonusPercent: 15, color: '#b91c1c' },
      { level: 10, minExp: 1000000, withdrawalLimit: 1000000, bonusPercent: 20, color: '#fbbf24' }
    ];
    res.json({ success: true, data: vipLevels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user VIP info
router.get('/my', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const vipLevels = [
      { level: 1, minExp: 0, withdrawalLimit: 10000, bonusPercent: 0 },
      { level: 2, minExp: 1000, withdrawalLimit: 20000, bonusPercent: 1 },
      { level: 3, minExp: 5000, withdrawalLimit: 30000, bonusPercent: 2 },
      { level: 4, minExp: 10000, withdrawalLimit: 50000, bonusPercent: 3 },
      { level: 5, minExp: 25000, withdrawalLimit: 75000, bonusPercent: 5 },
      { level: 6, minExp: 50000, withdrawalLimit: 100000, bonusPercent: 7 },
      { level: 7, minExp: 100000, withdrawalLimit: 150000, bonusPercent: 10 },
      { level: 8, minExp: 250000, withdrawalLimit: 250000, bonusPercent: 12 },
      { level: 9, minExp: 500000, withdrawalLimit: 500000, bonusPercent: 15 },
      { level: 10, minExp: 1000000, withdrawalLimit: 1000000, bonusPercent: 20 }
    ];

    const currentLevelInfo = vipLevels.find(v => v.level === user.vipLevel) || vipLevels[0];
    const nextLevelInfo = vipLevels.find(v => v.level === user.vipLevel + 1);
    const progressToNext = nextLevelInfo 
      ? ((user.vipExp - currentLevelInfo.minExp) / (nextLevelInfo.minExp - currentLevelInfo.minExp)) * 100
      : 100;

    res.json({
      success: true,
      data: {
        vipLevel: user.vipLevel,
        vipExp: user.vipExp,
        nextLevelExp: user.nextLevelExp,
        progressToNext: Math.min(progressToNext, 100),
        withdrawalLimit: currentLevelInfo.withdrawalLimit,
        bonusPercent: currentLevelInfo.bonusPercent,
        nextLevel: nextLevelInfo?.level || null,
        nextLevelBonus: nextLevelInfo?.bonusPercent || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check daily bonus
router.get('/daily-bonus', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const checkInResult = user.checkDailyBonus();
    const bonusConfig = [10, 15, 20, 25, 30, 40, 50, 70, 100, 150];
    const currentStreak = checkInResult.isStreak ? user.checkInStreak + 1 : 1;
    const bonusIndex = Math.min(currentStreak - 1, bonusConfig.length - 1);
    const todayBonus = bonusConfig[bonusIndex];

    res.json({
      success: true,
      data: {
        canClaim: checkInResult.canClaim,
        alreadyClaimed: checkInResult.alreadyClaimed,
        todayBonus,
        currentStreak: user.checkInStreak,
        nextStreakBonus: bonusConfig[Math.min(currentStreak, bonusConfig.length - 1)],
        totalCheckInBonus: user.totalCheckInBonus || 0,
        lastCheckIn: user.lastCheckIn
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claim daily bonus
router.post('/claim-daily-bonus', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const result = await user.claimDailyBonus();
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Create transaction
    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'bonus',
      amount: result.bonusAmount,
      balanceBefore: user.balance - result.bonusAmount,
      balanceAfter: user.balance,
      status: 'success',
      remark: `Daily check-in bonus - Streak ${result.streak} days`
    }).save();

    res.json({
      success: true,
      message: 'Daily bonus claimed!',
      bonusAmount: result.bonusAmount,
      streak: result.streak,
      nextBonus: result.nextBonus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add VIP experience (called after game bets)
router.post('/add-exp', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const levelResult = await user.addVIPExp(amount);
    await user.save();

    if (levelResult.leveledUp) {
      // Create level up transaction
      await new Transaction({
        userId: user._id,
        uid: user.uid,
        type: 'bonus',
        amount: 0,
        balanceBefore: user.balance,
        balanceAfter: user.balance,
        status: 'success',
        remark: `VIP Level Up! Now Level ${levelResult.newLevel}`
      }).save();
    }

    res.json({
      success: true,
      vipLevel: user.vipLevel,
      vipExp: user.vipExp,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
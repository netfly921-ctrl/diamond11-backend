const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

router.post('/spin', verifyToken, async (req, res) => {
  try {
    const SPIN_COST = 20; // Ek spin ka ₹20 lagega
    const user = await User.findById(req.userId);
    
    if (user.balance < SPIN_COST) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Need ₹${SPIN_COST} to spin.` });
    }

    // Spin Prizes (Rewards)
    const prizes = [0, 10, 20, 50, 100, 500]; 
    // Random probability logic
    const random = Math.random() * 100;
    let winAmount = 0;
    
    if (random < 50) winAmount = 0;         // 50% chance to win ₹0
    else if (random < 75) winAmount = 10;   // 25% chance to win ₹10
    else if (random < 90) winAmount = 20;   // 15% chance to win ₹20
    else if (random < 98) winAmount = 50;   // 8% chance to win ₹50
    else if (random < 99.5) winAmount = 100;// 1.5% chance to win ₹100
    else winAmount = 500;                   // 0.5% chance to win ₹500

    // Deduct cost and add win amount
    const balanceBefore = user.balance;
    user.balance = user.balance - SPIN_COST + winAmount;
    await user.save();

    // Save Transaction
    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: winAmount > SPIN_COST ? 'game_win' : 'game_loss',
      amount: winAmount > 0 ? winAmount : SPIN_COST,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      remark: `Lucky Spin: Cost ₹${SPIN_COST}, Won ₹${winAmount}`
    }).save();

    res.json({ 
      success: true, 
      winAmount, 
      newBalance: user.balance,
      prizeIndex: prizes.indexOf(winAmount)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get game list
router.get('/list', async (req, res) => {
  const games = await Game.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json({ success: true, data: games });
});

// Place bet
router.post('/place-bet', verifyToken, async (req, res) => {
  try {
    const { gameCode, betAmount } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.balance < betAmount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const balanceBefore = user.balance;
    user.balance -= betAmount;
    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'game_loss',
      amount: betAmount,
      balanceBefore,
      balanceAfter: user.balance,
      gameCode,
      status: 'success'
    }).save();

    res.json({ success: true, newBalance: user.balance, message: 'Bet placed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cashout win
router.post('/cashout', verifyToken, async (req, res) => {
  try {
    const { gameCode, betAmount, winAmount } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const balanceBefore = user.balance;
    user.balance += winAmount;
    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'game_win',
      amount: winAmount,
      balanceBefore,
      balanceAfter: user.balance,
      gameCode,
      betAmount,
      status: 'success'
    }).save();

    res.json({ success: true, newBalance: user.balance, message: 'Win added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Game result (for admin control)
router.post('/result', verifyToken, async (req, res) => {
  const { gameCode } = req.body;
  const game = await Game.findOne({ code: gameCode });

  let isWin = false;
  if (game?.isManualActive && game.manualResult !== 'none') {
    isWin = game.manualResult === 'win';
  } else {
    isWin = Math.random() * 100 < (game?.winPercentage || 40);
  }
  res.json({ success: true, isWin });
});

module.exports = router;
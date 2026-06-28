const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get top players
router.get('/top', async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    let startDate = new Date();
    if (period === 'today') startDate.setHours(0, 0, 0, 0);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

    const topWinners = await Transaction.aggregate([
      { $match: { type: 'game_win', createdAt: { $gte: startDate }, status: 'success' } },
      { $group: { _id: '$uid', totalWon: { $sum: '$amount' }, username: { $first: '$uid' } } },
      { $sort: { totalWon: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const topPlayers = await Transaction.aggregate([
      { $match: { type: { $in: ['game_win', 'game_loss'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: '$uid', totalBets: { $sum: 1 }, username: { $first: '$uid' } } },
      { $sort: { totalBets: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, data: { topWinners, topPlayers, period } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
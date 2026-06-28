const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get jackpot info
router.get('/info', async (req, res) => {
  try {
    // In real app, fetch from database
    const jackpotAmount = 50000 + Math.floor(Math.random() * 10000);
    res.json({ success: true, data: { currentJackpot: jackpotAmount, nextDraw: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
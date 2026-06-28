const express = require('express');
const router = express.Router();
const GameControl = require('../models/GameControl');
const { verifyAdmin } = require('../middleware/auth');

// Get all games for admin
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const games = await GameControl.find().sort({ isActive: -1 });
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update game settings
router.put('/:gameCode', verifyAdmin, async (req, res) => {
  try {
    let config = await GameControl.findOne({ gameCode: req.params.gameCode });
    
    if (!config) {
      config = new GameControl({
        gameCode: req.params.gameCode,
        gameName: req.params.gameCode.toUpperCase(),
        ...req.body
      });
      await config.save();
    } else {
      Object.assign(config, req.body);
      await config.save();
    }

    res.json({ success: true, message: 'Game updated successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
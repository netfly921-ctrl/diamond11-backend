const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// ✅ Get all active games
router.get('/list', async (req, res) => {
  try {
    const games = await Game.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({
      success: true,
      data: games,
      count: games.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get single game by code
router.get('/play/:code', async (req, res) => {
  try {
    const game = await Game.findOne({ code: req.params.code, isActive: true });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Admin: Add new game
router.post('/add', async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.json({ success: true, data: game, message: 'Game added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Admin: Update game
router.put('/update/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: game, message: 'Game updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Admin: Delete game
router.delete('/delete/:id', async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Game deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Admin: Toggle game active/inactive
router.put('/toggle/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    game.isActive = !game.isActive;
    await game.save();
    res.json({ success: true, data: game, message: `Game ${game.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
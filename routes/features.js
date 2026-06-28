const express = require('express');
const router = express.Router();
const Feature = require('../models/Feature');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all features (public)
router.get('/', async (req, res) => {
  try {
    const features = await Feature.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get enabled features only (public)
router.get('/enabled', async (req, res) => {
  try {
    const features = await Feature.find({ isEnabled: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create feature
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const feature = new Feature(req.body);
    await feature.save();
    res.json({ success: true, message: 'Feature created!', feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update feature
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const feature = await Feature.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Feature updated!', feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Toggle feature enable/disable
router.put('/:id/toggle', verifyAdmin, async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    feature.isEnabled = !feature.isEnabled;
    feature.isComingSoon = !feature.isEnabled;
    await feature.save();
    res.json({ success: true, message: `Feature ${feature.isEnabled ? 'enabled' : 'disabled'}`, feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete feature
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await Feature.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feature deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize default features (call once)
router.post('/init', verifyAdmin, async (req, res) => {
  try {
    const defaultFeatures = [
      { name: 'Cashback', displayName: 'Cashback', icon: 'FaPercent', route: '/cashback', color: 'text-green-400', bgColor: 'bg-green-500/20', isEnabled: false, isComingSoon: true, sortOrder: 1 },
      { name: 'VIP', displayName: 'VIP Benefits', icon: 'FaCrown', route: '/vip', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', isEnabled: true, isComingSoon: false, sortOrder: 2 },
      { name: 'Referral', displayName: 'Refer & Earn', icon: 'FaUsers', route: '/promotion', color: 'text-blue-400', bgColor: 'bg-blue-500/20', isEnabled: true, isComingSoon: false, sortOrder: 3 },
      { name: 'DailyBonus', displayName: 'Daily Bonus', icon: 'FaCalendarCheck', route: '/daily-bonus', color: 'text-orange-400', bgColor: 'bg-orange-500/20', isEnabled: true, isComingSoon: false, sortOrder: 4 },
      { name: 'Jackpot', displayName: 'Jackpot', icon: 'FaTrophy', route: '/jackpot', color: 'text-purple-400', bgColor: 'bg-purple-500/20', isEnabled: false, isComingSoon: true, sortOrder: 5 },
      { name: 'Tasks', displayName: 'Daily Tasks', icon: 'FaCheckCircle', route: '/tasks', color: 'text-pink-400', bgColor: 'bg-pink-500/20', isEnabled: false, isComingSoon: true, sortOrder: 6 },
      { name: 'LuckySpin', displayName: 'Lucky Spin', icon: 'FaSpinner', route: '/lucky-spin', color: 'text-red-400', bgColor: 'bg-red-500/20', isEnabled: false, isComingSoon: true, sortOrder: 7 },
      { name: 'Mail', displayName: 'Mail Box', icon: 'FaEnvelope', route: '/mail', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', isEnabled: false, isComingSoon: true, sortOrder: 8 },
      { name: 'Support', displayName: 'Support', icon: 'FaHeadset', route: '/support', color: 'text-teal-400', bgColor: 'bg-teal-500/20', isEnabled: false, isComingSoon: true, sortOrder: 9 },
      { name: 'Settings', displayName: 'Settings', icon: 'FaCog', route: '/settings', color: 'text-gray-400', bgColor: 'bg-gray-500/20', isEnabled: true, isComingSoon: false, sortOrder: 10 }
    ];

    for (const f of defaultFeatures) {
      const exists = await Feature.findOne({ name: f.name });
      if (!exists) {
        await new Feature(f).save();
      }
    }

    res.json({ success: true, message: 'Default features initialized!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
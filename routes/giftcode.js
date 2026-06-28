const express = require('express');
const router = express.Router();
const GiftCode = require('../models/GiftCode');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// User: Redeem gift code
router.post('/redeem', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    
    const giftCode = await GiftCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!giftCode) return res.status(404).json({ success: false, message: '❌ Invalid Gift Code' });
    
    if (giftCode.expiryDate && giftCode.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: '❌ Gift Code Expired' });
    }
    
    if (giftCode.usedCount >= giftCode.maxUsage) {
      return res.status(400).json({ success: false, message: '❌ Gift Code Usage Limit Reached' });
    }
    
    if (giftCode.usedBy.some(u => u.uid === user.uid)) {
      return res.status(400).json({ success: false, message: '❌ You already used this code' });
    }
    
    if (giftCode.minDeposit > 0 && user.totalDeposit < giftCode.minDeposit) {
      return res.status(400).json({ success: false, message: `❌ Min deposit ₹${giftCode.minDeposit} required` });
    }

    let bonusAmount = 0;
    if (giftCode.bonusType === 'fixed') {
      bonusAmount = giftCode.bonusAmount;
    } else {
      bonusAmount = Math.floor((user.balance * giftCode.bonusAmount) / 100);
    }

    const balanceBefore = user.balance;
    user.balance += bonusAmount;
    await user.save();

    giftCode.usedCount += 1;
    giftCode.usedBy.push({ uid: user.uid, usedAt: new Date() });
    await giftCode.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'bonus',
      amount: bonusAmount,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      remark: `Gift Code: ${code}`
    }).save();

    res.json({ success: true, message: `🎉 Gift Code Applied! ₹${bonusAmount} added to your balance!`, bonusAmount, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create gift code
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const { code, bonusAmount, bonusType, maxUsage, expiryDate, minDeposit, description } = req.body;
    
    const existing = await GiftCode.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Code already exists' });

    const giftCode = new GiftCode({
      code: code.toUpperCase(),
      bonusAmount,
      bonusType: bonusType || 'fixed',
      maxUsage,
      expiryDate,
      minDeposit,
      description,
      createdBy: req.adminId
    });

    await giftCode.save();
    res.json({ success: true, message: '🎁 Gift Code Created!', giftCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all gift codes
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const giftCodes = await GiftCode.find().sort({ createdAt: -1 });
    res.json({ success: true, data: giftCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete gift code
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await GiftCode.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gift Code Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Toggle gift code active/inactive
router.put('/:id/toggle', verifyAdmin, async (req, res) => {
  try {
    const giftCode = await GiftCode.findById(req.params.id);
    giftCode.isActive = !giftCode.isActive;
    await giftCode.save();
    res.json({ success: true, message: `Gift Code ${giftCode.isActive ? 'Activated' : 'Deactivated'}`, giftCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// User: Apply coupon
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon' });
    if (coupon.expiryDate && coupon.expiryDate < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Usage limit reached' });
    if (coupon.usedBy.some(u => u.uid === user.uid)) return res.status(400).json({ success: false, message: 'Already used' });
    if (user.balance < coupon.minDeposit) return res.status(400).json({ success: false, message: `Min ₹${coupon.minDeposit} required` });

    let bonusAmount = coupon.bonusType === 'fixed' ? coupon.bonusAmount : (user.balance * coupon.bonusAmount) / 100;
    if (bonusAmount > coupon.maxBonus) bonusAmount = coupon.maxBonus;

    const balanceBefore = user.balance;
    user.balance += bonusAmount;
    await user.save();

    coupon.usedCount += 1;
    coupon.usedBy.push({ uid: user.uid, usedAt: new Date() });
    await coupon.save();

    await new Transaction({ userId: user._id, uid: user.uid, type: 'bonus', amount: bonusAmount, balanceBefore, balanceAfter: user.balance, status: 'success', remark: `Coupon: ${code}` }).save();

    res.json({ success: true, message: `🎉 Bonus ₹${bonusAmount} added!`, bonusAmount, newBalance: user.balance });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Admin: Create coupon
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.json({ success: true, message: 'Coupon created!', coupon });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Admin: Get all coupons
router.get('/all', verifyAdmin, async (req, res) => {
  try { const coupons = await Coupon.find().sort({ createdAt: -1 }); res.json({ success: true, data: coupons }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Admin: Delete coupon
router.delete('/:id', verifyAdmin, async (req, res) => {
  try { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
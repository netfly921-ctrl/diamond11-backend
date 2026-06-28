const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get referral settings
router.get('/settings', async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const settings = await Setting.find({ key: { $in: ['referralBonus', 'referralCommissionPercent'] } });
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    
    res.json({
      success: true,
      data: {
        referralBonus: parseFloat(settingsObj.referralBonus || 10),
        referralCommissionPercent: parseFloat(settingsObj.referralCommissionPercent || 5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user referral info
router.get('/info', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const referredUsers = await User.find({ referredBy: user.uid });
    const referrals = await Referral.find({ referrerId: user.uid }).sort({ createdAt: -1 }).limit(20);
    
    const totalEarnings = referrals.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    const pendingEarnings = referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        totalEarnings,
        pendingEarnings,
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
        referredUsers: referredUsers.map(u => ({ uid: u.uid, phone: u.phone, joinedAt: u.createdAt })),
        referrals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process referral commission
router.post('/process-commission', verifyToken, async (req, res) => {
  try {
    const { userId, depositAmount } = req.body;
    
    const user = await User.findById(userId);
    if (!user || !user.referredBy) {
      return res.json({ success: true, message: 'No referrer' });
    }

    const referrer = await User.findOne({ uid: user.referredBy });
    if (!referrer) {
      return res.json({ success: true, message: 'Referrer not found' });
    }

    const Setting = require('../models/Setting');
    const setting = await Setting.findOne({ key: 'referralCommissionPercent' });
    const commissionPercent = parseFloat(setting?.value || 5);
    const commissionAmount = (depositAmount * commissionPercent) / 100;

    const existingReferral = await Referral.findOne({
      referrerId: referrer.uid,
      referredId: user.uid,
      depositAmount
    });

    if (existingReferral) {
      return res.json({ success: true, message: 'Commission already processed' });
    }

    const referral = new Referral({
      referrerId: referrer.uid,
      referredId: user.uid,
      referredPhone: user.phone,
      commissionAmount,
      depositAmount,
      status: 'pending'
    });
    await referral.save();

    referrer.referralCount += 1;
    referrer.totalReferralEarnings += commissionAmount;
    await referrer.save();

    res.json({
      success: true,
      message: 'Referral commission processed',
      commissionAmount,
      referrerUid: referrer.uid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all referrals
router.get('/admin/all', async (req, res) => {
  try {
    const referrals = await Referral.find().sort({ createdAt: -1 }).limit(100);
    const totalCommissions = referrals.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    const pendingCommissions = referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

    res.json({
      success: true,
      data: {
        referrals,
        totalCommissions,
        pendingCommissions,
        count: referrals.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
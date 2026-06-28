const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// User: Create deposit request
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { amount, upiId, transactionId } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const deposit = new Deposit({
      userId: user._id,
      uid: user.uid,
      phone: user.phone,
      amount: parseFloat(amount),
      upiId,
      transactionId,
      status: 'pending'
    });

    await deposit.save();

    res.json({ success: true, message: 'Deposit request submitted successfully', depositId: deposit._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User: Get own deposit history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all deposit requests
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const query = status === 'all' ? {} : { status };
    const deposits = await Deposit.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Approve deposit
router.put('/approve', verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.body;
    
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit already processed' });
    }

    const user = await User.findOne({ uid: deposit.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Add balance to user
    const balanceBefore = user.balance;
    user.balance += deposit.amount;
    user.totalDeposit = (user.totalDeposit || 0) + deposit.amount;
    await user.save();

    // Update deposit
    deposit.status = 'approved';
    deposit.processedBy = req.adminId;
    deposit.processedAt = new Date();
    await deposit.save();

    // Create transaction
    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'deposit',
      amount: deposit.amount,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      remark: 'Deposit approved by admin'
    }).save();

    // ✅ REFERRAL COMMISSION CODE STARTS HERE ✅
    try {
      const Referral = require('../models/Referral');
      const Setting = require('../models/Setting');
      
      // Get commission percentage
      const setting = await Setting.findOne({ key: 'referralCommissionPercent' });
      const commissionPercent = parseFloat(setting?.value || 5);
      const commissionAmount = (deposit.amount * commissionPercent) / 100;

      // Check if user has a referrer
      if (user.referredBy && commissionAmount > 0) {
        const referrer = await User.findOne({ uid: user.referredBy });
        
        if (referrer) {
          // Check if commission already processed for this deposit
          const existingReferral = await Referral.findOne({
            referrerId: referrer.uid,
            referredId: user.uid,
            depositAmount: deposit.amount
          });

          if (!existingReferral) {
            // Create referral record
            const referral = new Referral({
              referrerId: referrer.uid,
              referredId: user.uid,
              referredPhone: user.phone,
              commissionAmount,
              depositAmount: deposit.amount,
              status: 'paid'
            });
            await referral.save();

            // Add commission to referrer balance
            const referrerBalanceBefore = referrer.balance;
            referrer.balance += commissionAmount;
            referrer.totalReferralEarnings = (referrer.totalReferralEarnings || 0) + commissionAmount;
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            await referrer.save();

            // Create transaction for referrer
            await new Transaction({
              userId: referrer._id,
              uid: referrer.uid,
              type: 'commission',
              amount: commissionAmount,
              balanceBefore: referrerBalanceBefore,
              balanceAfter: referrer.balance,
              status: 'success',
              remark: `Referral commission from ${user.uid} - Deposit ₹${deposit.amount}`
            }).save();

            console.log(`✅ Referral commission: ₹${commissionAmount} paid to ${referrer.uid} from ${user.uid}`);
          }
        }
      }
    } catch (referralError) {
      console.error('Referral commission error:', referralError);
      // Don't fail the deposit if referral fails
    }
    // ✅ REFERRAL COMMISSION CODE ENDS HERE ✅

    res.json({ success: true, message: 'Deposit approved successfully', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Reject deposit
router.put('/reject', verifyAdmin, async (req, res) => {
  try {
    const { depositId, remark } = req.body;
    
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit already processed' });
    }

    deposit.status = 'rejected';
    deposit.remark = remark || 'Rejected by admin';
    deposit.processedBy = req.adminId;
    deposit.processedAt = new Date();
    await deposit.save();

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
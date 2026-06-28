const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const { verifyAdmin } = require('../middleware/auth');

// ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = admin.generateToken();

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Dashboard Stats
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    
    const deposits = await Transaction.find({ type: 'deposit' });
    const totalDeposit = deposits.reduce((sum, t) => sum + t.amount, 0);
    
    const withdraws = await Transaction.find({ type: 'withdraw', status: 'success' });
    const totalWithdraw = withdraws.reduce((sum, t) => sum + t.amount, 0);
    
    const pendingWithdraws = await Withdraw.countDocuments({ status: 'pending' });
    const netProfit = totalDeposit - totalWithdraw;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDeposit,
        totalWithdraw,
        netProfit,
        pendingWithdraws
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET All Users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update User Balance
router.put('/user/balance', verifyAdmin, async (req, res) => {
  try {
    const { userId, amount, type, remark } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const balanceBefore = user.balance;
    const amountNum = parseFloat(amount);

    if (type === 'add') {
      user.balance += amountNum;
    } else if (type === 'deduct') {
      if (user.balance < amountNum) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      user.balance -= amountNum;
    }

    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: type === 'add' ? 'bonus' : 'refund',
      amount: amountNum,
      balanceBefore,
      balanceAfter: user.balance,
      remark: remark || `Admin ${type} balance`,
      status: 'success'
    }).save();

    res.json({ 
      success: true, 
      message: 'Balance updated successfully', 
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Block/Unblock User
router.put('/user/block', verifyAdmin, async (req, res) => {
  try {
    const { userId, isBlocked } = req.body;
    await User.findByIdAndUpdate(userId, { isBlocked: !isBlocked });
    res.json({ success: true, message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all deposits
router.get('/deposits/all', verifyAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    const deposits = await Deposit.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all withdraws
router.get('/withdraws/all', verifyAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    const withdraws = await Withdraw.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// APPROVE deposit
router.put('/deposits/approve', verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.body;
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

    const user = await User.findOne({ uid: deposit.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const balanceBefore = user.balance;
    user.balance += deposit.amount;
    user.totalDeposit = (user.totalDeposit || 0) + deposit.amount;
    await user.save();

    deposit.status = 'approved';
    deposit.processedBy = req.adminId;
    deposit.processedAt = new Date();
    await deposit.save();

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

    res.json({ success: true, message: 'Deposit approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REJECT deposit
router.put('/deposits/reject', verifyAdmin, async (req, res) => {
  try {
    const { depositId, remark } = req.body;
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

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

// APPROVE withdraw
router.put('/withdraws/approve', verifyAdmin, async (req, res) => {
  try {
    const { withdrawId } = req.body;
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.status(404).json({ success: false, message: 'Withdraw not found' });

    withdraw.status = 'approved';
    withdraw.processedBy = req.adminId;
    withdraw.processedAt = new Date();
    await withdraw.save();

    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REJECT withdraw
router.put('/withdraws/reject', verifyAdmin, async (req, res) => {
  try {
    const { withdrawId, remark } = req.body;
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.status(404).json({ success: false, message: 'Withdraw not found' });

    const user = await User.findOne({ uid: withdraw.uid });
    if (user) {
      user.balance += withdraw.amount;
      await user.save();
    }

    withdraw.status = 'rejected';
    withdraw.remark = remark || 'Rejected by admin';
    withdraw.processedBy = req.adminId;
    withdraw.processedAt = new Date();
    await withdraw.save();

    res.json({ success: true, message: 'Withdrawal rejected. Amount refunded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Game Management Routes
router.post('/game', verifyAdmin, async (req, res) => {
  try {
    const Game = require('../models/Game');
    const game = new Game(req.body);
    await game.save();
    res.json({ success: true, message: 'Game added successfully', game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/game/:id', verifyAdmin, async (req, res) => {
  try {
    const Game = require('../models/Game');
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Game updated successfully', game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/game/:id/status', verifyAdmin, async (req, res) => {
  try {
    const Game = require('../models/Game');
    const { isActive } = req.body;
    const game = await Game.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json({ success: true, message: 'Game status updated', game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/game/:id', verifyAdmin, async (req, res) => {
  try {
    const Game = require('../models/Game');
    await Game.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Finance Stats
router.get('/finance/stats', verifyAdmin, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    
    const deposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const withdrawals = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const users = await User.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance' } } }
    ]);
    
    const totalDeposits = deposits[0]?.total || 0;
    const totalWithdrawals = withdrawals[0]?.total || 0;
    const totalUserBalance = users[0]?.totalBalance || 0;
    
    res.json({
      success: true,
      data: {
        totalDeposits,
        totalWithdrawals,
        netProfit: totalDeposits - totalWithdrawals,
        totalUserBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Finance Transactions
router.get('/finance/transactions', verifyAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const Transaction = require('../models/Transaction');
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Referral Stats
router.get('/referral/stats', verifyAdmin, async (req, res) => {
  try {
    const Referral = require('../models/Referral');
    
    const totalReferrals = await Referral.countDocuments();
    const paidCommission = await Referral.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);
    const pendingCommission = await Referral.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalReferrals,
        totalCommission: paidCommission[0]?.total || 0,
        pendingCommission: pendingCommission[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
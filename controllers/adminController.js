const Admin = require('../models/Admin');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const Withdraw = require('../models/Withdraw');
const Setting = require('../models/Setting');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(400).json({ success: false, message: 'Admin account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id, username: admin.username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: today } });
    const totalDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdraws = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const todayDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const pendingWithdraws = await Withdraw.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDeposit: totalDeposits[0]?.total || 0,
        totalWithdraw: totalWithdraws[0]?.total || 0,
        todayDeposit: todayDeposits[0]?.total || 0,
        todayDepositCount: todayDeposits[0]?.count || 0,
        pendingWithdraws,
        netProfit: (totalDeposits[0]?.total || 0) - (totalWithdraws[0]?.total || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = search ? {
      $or: [
        { phone: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserBalance = async (req, res) => {
  try {
    const { userId, amount, type, remark } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balanceBefore = user.balance;
    if (type === 'add') {
      user.balance += parseFloat(amount);
    } else if (type === 'deduct') {
      if (user.balance < parseFloat(amount)) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      user.balance -= parseFloat(amount);
    }

    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: type === 'add' ? 'bonus' : 'refund',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: user.balance,
      remark: remark || `Admin ${type} balance`,
      status: 'success'
    }).save();

    res.json({ success: true, message: 'Balance updated successfully', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId, isBlocked } = req.body;
    await User.findByIdAndUpdate(userId, { isBlocked });
    res.json({ success: true, message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGame = async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json({ success: true, message: 'Game created successfully', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Game updated successfully', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWithdrawRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const withdraws = await Withdraw.find({ status }).sort({ createdAt: -1 });
    res.json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processWithdraw = async (req, res) => {
  try {
    const { id, status, remark } = req.body;
    const withdraw = await Withdraw.findById(id);
    
    if (!withdraw) {
      return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    }

    withdraw.status = status;
    withdraw.remark = remark;
    withdraw.processedBy = req.adminId;
    withdraw.processedAt = new Date();
    await withdraw.save();

    if (status === 'approved') {
      const user = await User.findOne({ uid: withdraw.uid });
      if (user && user.balance >= withdraw.amount) {
        user.balance -= withdraw.amount;
        await user.save();

        await new Transaction({
          userId: user._id,
          uid: user.uid,
          type: 'withdraw',
          amount: withdraw.amount,
          balanceBefore: user.balance + withdraw.amount,
          balanceAfter: user.balance,
          status: 'success',
          remark: 'Withdraw approved'
        }).save();
      }
    }

    res.json({ success: true, message: `Withdraw ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      await setting.save();
    } else {
      setting = new Setting({ key, value, description });
      await setting.save();
    }
    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { userId, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
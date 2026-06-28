const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { phone, password, referralCode } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let referredBy = '';
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer.uid;
      }
    }

    const user = new User({
      phone,
      password: hashedPassword,
      referredBy,
      balance: 0
    });

    await user.save();

    // Add to referrer's team and give bonus
    if (referrer) {
      referrer.team.push(user.uid);
      referrer.balance += 10; // Referral bonus
      await referrer.save();

      // Create transaction for referrer
      const Transaction = require('../models/Transaction');
      await new Transaction({
        userId: referrer._id,
        uid: referrer.uid,
        type: 'bonus',
        amount: 10,
        balanceBefore: referrer.balance - 10,
        balanceAfter: referrer.balance,
        remark: `Referral bonus for ${user.uid}`
      }).save();
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(400).json({ success: false, message: 'Account is blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        name: user.name,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        totalCommission: user.totalCommission
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
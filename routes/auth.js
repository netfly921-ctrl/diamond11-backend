const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/validation');

// User Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { phone, uid, password } = req.body;
    
    let user;
    if (phone) {
      user = await User.findOne({ phone });
    } else if (uid) {
      user = await User.findOne({ uid });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = user.generateToken();
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        balance: user.balance,
        vipLevel: user.vipLevel,
        lastLogin: user.lastLogin,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// User Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { phone, password, referralCode } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = 'U' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

    const user = new User({
      phone,
      password: hashedPassword,
      uid,
      referralCode: referralCode || null,
      balance: 0,
      vipLevel: 1
    });

    await user.save();
    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Registration successful! Welcome to Diamond 11.',
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        balance: user.balance,
        vipLevel: user.vipLevel
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Phone number already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
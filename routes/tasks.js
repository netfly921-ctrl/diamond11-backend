const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

// Get daily tasks
router.get('/list', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const user = await User.findById(req.userId);
    
    const tasks = [
      { id: 1, name: 'Daily Login', description: 'Login today', reward: 5, icon: 'FaSignInAlt', completed: true },
      { id: 2, name: 'Place 5 Bets', description: 'Place 5 bets in any game', reward: 20, icon: 'FaDice', completed: false },
      { id: 3, name: 'Deposit ₹100', description: 'Add ₹100 to wallet', reward: 50, icon: 'FaRupeeSign', completed: false },
      { id: 4, name: 'Refer a Friend', description: 'Invite a friend', reward: 100, icon: 'FaUsers', completed: false },
      { id: 5, name: 'Reach VIP Level 2', description: 'Upgrade to VIP 2', reward: 200, icon: 'FaCrown', completed: user.vipLevel >= 2 }
    ];

    res.json({ success: true, data: { tasks, totalReward: tasks.filter(t => t.completed).reduce((sum, t) => sum + t.reward, 0) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Claim task reward
router.post('/claim/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = await User.findById(req.userId);
    
    // Simulate task completion check (in real app, verify actual completion)
    const reward = Math.floor(Math.random() * 50) + 10;
    
    const balanceBefore = user.balance;
    user.balance += reward;
    await user.save();

    await new Transaction({
      userId: user._id,
      uid: user.uid,
      type: 'bonus',
      amount: reward,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      remark: `Task completed: Task #${taskId}`
    }).save();

    res.json({ success: true, message: `🎉 Task completed! ₹${reward} added!`, reward, newBalance: user.balance });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
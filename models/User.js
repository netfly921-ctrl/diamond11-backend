const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  totalDeposit: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },
  totalWager: { type: Number, default: 0 },
  
  // VIP System
  vipLevel: { type: Number, default: 1 },
  vipExp: { type: Number, default: 0 },
  nextLevelExp: { type: Number, default: 1000 },
  
  // Daily Bonus
  lastCheckIn: { type: Date },
  checkInStreak: { type: Number, default: 0 },
  totalCheckInBonus: { type: Number, default: 0 },
  
  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  totalReferralEarnings: { type: Number, default: 0 },
  
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Generate unique referral code
userSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    this.referralCode = 'R' + this.uid.substring(1, 8).toUpperCase();
  }
  next();
});

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, uid: this.uid, phone: this.phone },
    process.env.JWT_SECRET || 'diamond11secretkey2024',
    { expiresIn: '24h' }
  );
};

// Check and update VIP level
userSchema.methods.checkVIPLevel = async function() {
  const vipLevels = [
    { level: 1, minExp: 0, withdrawalLimit: 10000, bonusPercent: 0 },
    { level: 2, minExp: 1000, withdrawalLimit: 20000, bonusPercent: 1 },
    { level: 3, minExp: 5000, withdrawalLimit: 30000, bonusPercent: 2 },
    { level: 4, minExp: 10000, withdrawalLimit: 50000, bonusPercent: 3 },
    { level: 5, minExp: 25000, withdrawalLimit: 75000, bonusPercent: 5 },
    { level: 6, minExp: 50000, withdrawalLimit: 100000, bonusPercent: 7 },
    { level: 7, minExp: 100000, withdrawalLimit: 150000, bonusPercent: 10 },
    { level: 8, minExp: 250000, withdrawalLimit: 250000, bonusPercent: 12 },
    { level: 9, minExp: 500000, withdrawalLimit: 500000, bonusPercent: 15 },
    { level: 10, minExp: 1000000, withdrawalLimit: 1000000, bonusPercent: 20 }
  ];

  const currentLevel = vipLevels.find(v => v.level === this.vipLevel) || vipLevels[0];
  
  for (let i = vipLevels.length - 1; i >= 0; i--) {
    if (this.vipExp >= vipLevels[i].minExp) {
      if (vipLevels[i].level > this.vipLevel) {
        this.vipLevel = vipLevels[i].level;
        this.nextLevelExp = vipLevels[i + 1]?.minExp || this.vipExp + 1000000;
        return { leveledUp: true, newLevel: this.vipLevel };
      }
      this.nextLevelExp = vipLevels[i + 1]?.minExp || this.vipExp + 1000000;
      break;
    }
  }
  
  return { leveledUp: false, currentLevel: this.vipLevel };
};

// Add VIP experience
userSchema.methods.addVIPExp = async function(amount) {
  const expToAdd = Math.floor(amount * 0.1); // 10% of amount as VIP exp
  this.vipExp += expToAdd;
  this.totalWager = (this.totalWager || 0) + amount;
  return await this.checkVIPLevel();
};

// Check daily bonus
userSchema.methods.checkDailyBonus = function() {
  const now = new Date();
  const lastCheckIn = this.lastCheckIn ? new Date(this.lastCheckIn) : null;
  
  if (!lastCheckIn) {
    return { canClaim: true, isStreak: false };
  }
  
  const daysDiff = Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    return { canClaim: false, alreadyClaimed: true };
  } else if (daysDiff === 1) {
    return { canClaim: true, isStreak: true, streak: this.checkInStreak + 1 };
  } else {
    return { canClaim: true, isStreak: false, streakReset: true };
  }
};

// Claim daily bonus
userSchema.methods.claimDailyBonus = async function() {
  const bonusConfig = [10, 15, 20, 25, 30, 40, 50, 70, 100, 150]; // Bonus for streak 1-10
  const checkInResult = this.checkDailyBonus();
  
  if (!checkInResult.canClaim) {
    return { success: false, message: 'Already claimed today' };
  }
  
  const streak = checkInResult.isStreak ? this.checkInStreak + 1 : 1;
  const bonusIndex = Math.min(streak - 1, bonusConfig.length - 1);
  const bonusAmount = bonusConfig[bonusIndex];
  
  this.balance += bonusAmount;
  this.lastCheckIn = new Date();
  this.checkInStreak = streak;
  this.totalCheckInBonus = (this.totalCheckInBonus || 0) + bonusAmount;
  
  await this.save();
  
  return { 
    success: true, 
    bonusAmount, 
    streak, 
    nextBonus: bonusConfig[Math.min(streak, bonusConfig.length - 1)]
  };
};

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageGames: { type: Boolean, default: true },
    manageFinance: { type: Boolean, default: true },
    manageSettings: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate JWT token
adminSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, username: this.username, role: this.role },
    process.env.JWT_SECRET || 'diamond11secretkey2024',
    { expiresIn: '24h' }
  );
};

module.exports = mongoose.model('Admin', adminSchema);
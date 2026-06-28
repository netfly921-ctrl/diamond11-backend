const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. CLEAN CORS (Conflict hata diya)
app.use(cors({
  origin: true, // Har origin ko allow karega with credentials (Vercel ke liye best hai)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Preflight requests ke liye
app.options('*', cors());

// ✅ 2. Body Parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ✅ 3. Helmet - Iframe allow karne ke liye
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false,
  originAgentCluster: false
}));

// ✅ 4. Serve Games Folder
// Note: Games folder ko 'backend' folder ke andar daal dena best rahega
app.use('/games', express.static(path.join(__dirname, 'games'))); 
app.use('/games', express.static(path.join(__dirname, '../games')));

// ✅ 5. Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/game', require('./routes/game'));
  app.use('/api/wallet', require('./routes/wallet'));
  app.use('/api/referral', require('./routes/referral'));
  app.use('/api/deposit', require('./routes/deposit'));
  app.use('/api/withdraw', require('./routes/withdraw'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/vip', require('./routes/vip'));
  app.use('/api/coupon', require('./routes/coupon'));
  app.use('/api/leaderboard', require('./routes/leaderboard'));
  app.use('/api/dailybonus', require('./routes/dailybonus'));
  app.use('/api/features', require('./routes/features'));
  app.use('/api/luckyspin', require('./routes/luckyspin'));
  app.use('/api/cashback', require('./routes/cashback'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/jackpot', require('./routes/jackpot'));
  app.use('/api/giftcode', require('./routes/giftcode'));
  app.use('/api/admin/game-control', require('./routes/game-admin'));
  console.log('✅ All routes loaded');
} catch (error) {
  console.error('❌ Route error:', error.message);
}

// ✅ 6. Default route (Ab localhost nahi dikhayega)
app.get('/', (req, res) => {
  const fullUrl = req.protocol + '://' + req.get('host');
  res.json({ 
    success: true, 
    message: 'Diamond 11 API Running - NO RATE LIMITS',
    games: `${fullUrl}/games`,
    cors: 'enabled',
    status: 'online'
  });
});

// ✅ 7. Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ✅ 8. MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diamond11';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('🎉 MongoDB Connected Successfully!');
  
  // Create default admin
  const Admin = require('./models/Admin');
  const bcrypt = require('bcryptjs');
  
  Admin.findOne({ username: 'admin' }).then(async (admin) => {
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        role: 'superadmin',
        permissions: { manageUsers: true, manageGames: true, manageFinance: true, manageSettings: true }
      });
      console.log('✅ Default admin: admin / admin123');
    }
  }).catch(() => {});

  // Create settings
  const Setting = require('./models/Setting');
  const settings = [
    { key: 'upiId', value: 'admin@upi' },
    { key: 'accountName', value: 'Admin' },
    { key: 'accountNumber', value: '1234567890' },
    { key: 'ifsc', value: 'SBIN0001234' },
    { key: 'bankName', value: 'State Bank' },
    { key: 'referralCommissionPercent', value: '5' }
  ];
  settings.forEach(s => Setting.findOne({ key: s.key }).then(exists => { if (!exists) Setting.create(s); }).catch(() => {}));
  
})
.catch((err) => {
  console.error('❌ MongoDB Error:', err.message);
  process.exit(1);
});

// ✅ 9. Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
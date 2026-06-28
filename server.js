const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
dotenv.config();
const cors = require('cors');

app.use(cors({
  origin: [
    'https://diamond11-frontend.vercel.app/login', // YAHAN APNA VERCEL URL DAALO
    'http://localhost:3000'
  ],
  credentials: true
}));
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. CORS - Allow everything for development
app.use(cors({
  origin: true,  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
}));

// ✅ 2. Allow all origins manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Frame-Options', 'ALLOW-FROM http://localhost:3000/');
  res.header('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:3001;");
  next();
});

// ✅ 3. Body Parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ✅ 4. Helmet - Allow iframes
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false,
  originAgentCluster: false
}));

// ✅ 5. NO RATE LIMITING - Completely removed!

// ✅ 6. Serve Games Folder
app.use('/games', express.static(path.join(__dirname, '../games')));

// ✅ 7. Routes
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
  app.use('/api/features', require('./routes/features'));
  app.use('/api/luckyspin', require('./routes/luckyspin'));
  app.use('/api/cashback', require('./routes/cashback'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/jackpot', require('./routes/jackpot'));
app.use('/api/luckyspin', require('./routes/luckyspin'));
app.use('/api/giftcode', require('./routes/giftcode'));
app.use('/api/admin/game-control', require('./routes/game-admin'));
  console.log('✅ All routes loaded');
} catch (error) {
  console.error('❌ Route error:', error.message);
}

// ✅ 8. Default route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Diamond 11 API Running - NO RATE LIMITS',
    games: 'http://localhost:' + PORT + '/games',
    cors: 'enabled',
    iframe: 'allowed',
    rateLimit: 'disabled'
  });
});

// ✅ 9. Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ✅ 10. MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diamond11';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('');
  console.log('🎉 ============================================');
  console.log('🚀 Diamond 11 Server Running!');
  console.log('🎉 ============================================');
  console.log(`📱 API: http://localhost:${PORT}`);
  console.log(`🎮 Games: http://localhost:${PORT}/games`);
  console.log(`✅ CORS: Enabled (all origins)`);
  console.log(`✅ Iframe: Allowed`);
  console.log(`✅ Rate Limit: DISABLED`);
  console.log('🎉 ============================================');
  console.log('');
  
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
  console.error('💡 Start MongoDB: net start MongoDB');
  process.exit(1);
});

// ✅ 11. Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
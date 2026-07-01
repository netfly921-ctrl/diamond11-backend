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
  origin: true, 
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
app.use('/games', express.static(path.join(__dirname, 'games'))); 
app.use('/games', express.static(path.join(__dirname, '../games')));

// ✅ 5. Foolproof Routes (Chahe /api ho ya na ho, dono chalenge!)
try {
  app.use(['/api/auth', '/auth'], require('./routes/auth'));
  app.use(['/api/admin', '/admin'], require('./routes/admin'));
  app.use(['/api/game', '/game'], require('./routes/game'));
  app.use(['/api/wallet', '/wallet'], require('./routes/wallet'));
  app.use(['/api/referral', '/referral'], require('./routes/referral'));
  app.use(['/api/deposit', '/deposit'], require('./routes/deposit'));
  app.use(['/api/withdraw', '/withdraw'], require('./routes/withdraw'));
  app.use(['/api/settings', '/settings'], require('./routes/settings'));
  app.use(['/api/vip', '/vip'], require('./routes/vip'));
  app.use(['/api/coupon', '/coupon'], require('./routes/coupon'));
  app.use(['/api/leaderboard', '/leaderboard'], require('./routes/leaderboard'));
  app.use(['/api/dailybonus', '/dailybonus'], require('./routes/dailybonus'));
  app.use(['/api/features', '/features'], require('./routes/features'));
  app.use(['/api/luckyspin', '/luckyspin'], require('./routes/luckyspin'));
  app.use(['/api/cashback', '/cashback'], require('./routes/cashback'));
  app.use(['/api/tasks', '/tasks'], require('./routes/tasks'));
  app.use(['/api/jackpot', '/jackpot'], require('./routes/jackpot'));
  app.use(['/api/giftcode', '/giftcode'], require('./routes/giftcode'));
  app.use(['/api/admin/game-control', '/admin/game-control'], require('./routes/game-admin'));
  console.log('✅ All routes loaded with compatibility mode');
} catch (error) {
  console.error('❌ Route error:', error.message);
}

// ✅ 6. Default route
app.get('/', (req, res) => {
  const fullUrl = req.protocol + '://' + req.get('host');
  res.json({ 
    success: true, 
    message: 'Diamond 11 API Running - Compatible Mode',
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
  
   // ✅ Seed Default Games into MongoDB
  const seedDefaultGames = async () => {
    try {
      const games = [
        {
          name: 'aviator',
          code: 'aviator',
          displayName: 'Aviator',
          path: '/games/aviator/',
          icon: '✈️',
          image: '',
          gradient: 'from-blue-500 to-cyan-400',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 1
        },
        {
          name: 'wingo',
          code: 'wingo',
          displayName: 'Wingo',
          path: '/games/wingo/',
          icon: '🎡',
          image: '',
          gradient: 'from-orange-500 to-red-500',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 2
        },
        {
          name: 'coinflip',
          code: 'coinflip',
          displayName: 'Coin Flip',
          path: '/games/coinflip/',
          icon: '🪙',
          image: '',
          gradient: 'from-yellow-400 to-amber-600',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 3
        },
        {
          name: 'andarbahar',
          code: 'andarbahar',
          displayName: 'Andar Bahar',
          path: '/games/andarbahar/',
          icon: '🃏',
          image: '',
          gradient: 'from-purple-600 to-pink-500',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 4
        },
        {
          name: 'dragontiger',
          code: 'dragontiger',
          displayName: 'Dragon Tiger',
          path: '/games/dragontiger/',
          icon: '🐉',
          image: '',
          gradient: 'from-red-600 to-orange-600',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 5
        },
        {
          name: 'colorprediction',
          code: 'colorprediction',
          displayName: 'Color Prediction',
          path: '/games/colorprediction/',
          icon: '🎨',
          image: '',
          gradient: 'from-violet-500 to-indigo-500',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 6
        },
        {
          name: 'teenpatti',
          code: 'teenpatti',
          displayName: 'Teen Patti',
          path: '/games/teenpatti/',
          icon: '♠️',
          image: '',
          gradient: 'from-emerald-500 to-teal-700',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 7
        },
        {
          name: 'mines',
          code: 'mines',
          displayName: 'Mines',
          path: '/games/mines/',
          icon: '💣',
          image: '',
          gradient: 'from-gray-700 to-slate-900',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 8
        },
        {
          name: 'limbo',
          code: 'limbo',
          displayName: 'Limbo',
          path: '/games/limbo/',
          icon: '🚀',
          image: '',
          gradient: 'from-indigo-500 to-purple-900',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 9
        },
        {
          name: 'dice',
          code: 'dice',
          displayName: 'Dice',
          path: '/games/dice/',
          icon: '🎲',
          image: '',
          gradient: 'from-rose-500 to-red-800',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 10
        },
        {
          name: 'plinko',
          code: 'plinko',
          displayName: 'Plinko',
          path: '/games/plinko/',
          icon: '⚪',
          image: '',
          gradient: 'from-blue-400 to-blue-800',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 11
        },
        {
          name: 'roulette',
          code: 'roulette',
          displayName: 'Roulette',
          path: '/games/roulette/',
          icon: '🎯',
          image: '',
          gradient: 'from-red-700 to-black',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 12
        },
        {
          name: 'chickenpro',
          code: 'chickenpro',
          displayName: 'Chicken Pro',
          path: '/games/CHICKEN PRO/',
          icon: '🐔',
          image: '',
          gradient: 'from-yellow-400 to-orange-600',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 13
        },
        {
          name: 'hilo',
          code: 'hilo',
          displayName: 'Hilo',
          path: '/games/hilo/',
          icon: '🔢',
          image: '',
          gradient: 'from-green-600 to-lime-500',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 14
        },
        {
          name: 'wheel',
          code: 'wheel',
          displayName: 'Wheel',
          path: '/games/wheel/',
          icon: '🎡',
          image: '',
          gradient: 'from-fuchsia-500 to-pink-700',
          isActive: true,
          active: true,
          status: 'active',
          sortOrder: 15
        }
      ];

      const collection = mongoose.connection.db.collection('games');

      for (const game of games) {
        await collection.updateOne(
          { code: game.code },
          {
            $set: {
              ...game,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }

      console.log('✅ Default games seeded/updated in MongoDB');
    } catch (err) {
      console.error('❌ Games seed error:', err.message);
    }
  };

  seedDefaultGames();

// Seed games only if collection is empty
Game.countDocuments().then(count => {
  if (count === 0) {
    Game.insertMany(defaultGames)
      .then(() => console.log('✅ 15 default games seeded'))
      .catch(err => console.error('Seed error:', err.message));
  }
}).catch(() => {});
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
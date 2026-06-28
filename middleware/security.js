// ⚡⚡⚡ RATE LIMITING COMPLETELY DISABLED ⚡⚡⚡

const securityMiddleware = (app) => {
  console.log('⚡⚡ SECURITY MIDDLEWARE LOADED (NO RATE LIMITING) ⚡⚡⚡');
  
  // Helmet with iframe support
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: false,  // Allow iframes
    originAgentCluster: false
  }));

  // Allow all origins for development
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('X-Frame-Options', 'ALLOW-FROM http://localhost:3000/');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:3001 http://127.0.0.1:3000;");
    next();
  });

  // NO RATE LIMITING - Completely removed!
  console.log('✅ Rate limiting: DISABLED');
  console.log('✅ CORS: ENABLED for all origins');
  console.log('✅ Iframes: ALLOWED for localhost:3000');
};

module.exports = { securityMiddleware };
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Replit-aware port configuration
const PORT = process.env.PORT || 3002;
const IS_REPLIT = process.env.REPL_ID || process.env.REPLIT_DB_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT;

// Build CORS origins based on environment
const getCorsOrigins = () => {
  const origins = [
    'chrome-extension://*',
    'http://localhost:*',
    'http://127.0.0.1:*'
  ];
  
  if (IS_REPLIT) {
    // Add Replit-specific origins
    const replName = process.env.REPL_SLUG || 'TravianAssistant';
    const replOwner = process.env.REPL_OWNER || '*';
    
    origins.push(
      `https://${replName}.${replOwner}.repl.co`,
      `https://${replName}-*.${replOwner}.repl.co`,
      'https://*.replit.dev',
      'https://*.repl.co',
      'https://*.replit.app'
    );
  }
  
  // Allow custom CORS origin from environment
  if (process.env.CORS_ORIGIN) {
    origins.push(...process.env.CORS_ORIGIN.split(','));
  }
  
  return origins;
};

// Enable CORS for extension and Replit
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getCorsOrigins();
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Convert wildcard to regex
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Be permissive in development
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB connection (optional - comment out if not using)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('✅ Connected to MongoDB');
  }).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('ℹ️ Running without database');
  });
} else {
  console.log('ℹ️ No MongoDB URI provided, running in-memory mode');
}

// In-memory storage for when MongoDB is not available
const memoryStore = {
  villages: new Map(),
  accounts: new Map(),
  alerts: []
};

// Health check endpoint (required for testing)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? 'production' : 'development',
    platform: IS_REPLIT ? 'replit' : 'local',
    database: process.env.MONGODB_URI ? 'mongodb' : 'in-memory',
    uptime: process.uptime()
  });
});

// Village sync endpoint
app.post('/api/villages', async (req, res) => {
  const { accountId, village, villages } = req.body;
  console.log('📊 Received village data:', { 
    accountId, 
    villageName: village?.name,
    villageId: village?.id,
    villageCount: villages?.length 
  });
  
  // Store in memory
  if (accountId) {
    if (!memoryStore.villages.has(accountId)) {
      memoryStore.villages.set(accountId, []);
    }
    
    if (villages && Array.isArray(villages)) {
      memoryStore.villages.set(accountId, villages);
    } else if (village) {
      const stored = memoryStore.villages.get(accountId);
      const index = stored.findIndex(v => v.id === village.id);
      if (index >= 0) {
        stored[index] = { ...stored[index], ...village, lastUpdate: new Date() };
      } else {
        stored.push({ ...village, lastUpdate: new Date() });
      }
    }
  }
  
  res.json({ 
    success: true, 
    message: 'Village data received',
    timestamp: new Date().toISOString(),
    stored: memoryStore.villages.get(accountId)?.length || 0
  });
});

// Get all villages for an account
app.get('/api/villages/:accountId', async (req, res) => {
  const { accountId } = req.params;
  console.log('📋 Fetching villages for account:', accountId);
  
  const villages = memoryStore.villages.get(accountId) || [];
  
  res.json({
    accountId,
    villages,
    count: villages.length,
    source: process.env.MONGODB_URI ? 'database' : 'memory'
  });
});

// Create or update account
app.post('/api/account', async (req, res) => {
  const { accountId, serverUrl, accountName, tribe } = req.body;
  console.log('👤 Creating/updating account:', accountId);
  
  memoryStore.accounts.set(accountId, {
    accountId,
    serverUrl,
    accountName,
    tribe,
    created: memoryStore.accounts.get(accountId)?.created || new Date(),
    updated: new Date()
  });
  
  res.json({
    success: true,
    account: memoryStore.accounts.get(accountId)
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const baseUrl = IS_REPLIT 
    ? `https://${process.env.REPL_SLUG || 'TravianAssistant'}.${process.env.REPL_OWNER || 'repl'}.co`
    : `http://localhost:${PORT}`;
    
  res.json({ 
    message: 'TravianAssistant Backend API',
    version: '1.0.0',
    environment: {
      platform: IS_REPLIT ? 'replit' : 'local',
      mode: IS_PRODUCTION ? 'production' : 'development',
      port: PORT
    },
    endpoints: {
      health: '/api/health',
      villages: '/api/villages',
      account: '/api/account',
      websocket: baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    },
    stats: {
      accounts: memoryStore.accounts.size,
      villages: Array.from(memoryStore.villages.values()).flat().length,
      uptime: Math.floor(process.uptime()) + ' seconds'
    }
  });
});

// Start HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('🚀 TravianAssistant Backend Started');
  console.log('========================================');
  console.log(`📍 Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🖥️ Platform: ${IS_REPLIT ? 'Replit' : 'Local'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'MongoDB' : 'In-Memory'}`);
  
  if (IS_REPLIT) {
    const replName = process.env.REPL_SLUG || 'TravianAssistant';
    const replOwner = process.env.REPL_OWNER || 'your-username';
    console.log(`\n🌐 Access URLs:`);
    console.log(`   Preview: https://${replName}.${replOwner}.repl.co`);
    console.log(`   API: https://${replName}.${replOwner}.repl.co/api/health`);
    console.log(`   WebSocket: wss://${replName}.${replOwner}.repl.co`);
  } else {
    console.log(`\n🌐 Access URLs:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/health`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
  }
  console.log('========================================\n');
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log('🔌 WebSocket client connected from:', clientIp);
  
  // Send initial connection success
  ws.send(JSON.stringify({ 
    type: 'connection_established',
    timestamp: new Date().toISOString(),
    server: IS_REPLIT ? 'replit' : 'local'
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received WebSocket message:', data.type);
      
      if (data.type === 'auth') {
        // Store authenticated client
        clients.set(data.accountId, ws);
        console.log('✅ Client authenticated:', data.accountId);
        
        ws.send(JSON.stringify({ 
          type: 'auth_success',
          accountId: data.accountId
        }));
      } else if (data.type === 'village_update') {
        // Broadcast village update to other clients
        console.log('📡 Broadcasting village update');
        broadcast(data, ws);
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    // Remove from clients map
    for (const [accountId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(accountId);
        break;
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Broadcast to all connected clients except sender
function broadcast(data, sender) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
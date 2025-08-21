const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for extension
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:*', 'https://*.repl.co', 'https://*.replit.dev'],
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
  });
}

// Health check endpoint (required for testing)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Village sync endpoint
app.post('/api/villages', async (req, res) => {
  const { accountId, village } = req.body;
  console.log('📊 Received village data:', { 
    accountId, 
    villageName: village?.name,
    villageId: village?.id 
  });
  
  // TODO: Save to MongoDB
  // For now, just acknowledge receipt
  res.json({ 
    success: true, 
    message: 'Village data received',
    timestamp: new Date().toISOString()
  });
});

// Get all villages for an account
app.get('/api/villages/:accountId', async (req, res) => {
  const { accountId } = req.params;
  console.log('📋 Fetching villages for account:', accountId);
  
  // TODO: Fetch from MongoDB
  // For now, return mock data
  res.json({
    accountId,
    villages: [],
    message: 'MongoDB integration pending'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TravianAssistant Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      villages: '/api/villages',
      websocket: 'ws://' + req.headers.host
    }
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 HTTP: http://localhost:${PORT}`);
  console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected from:', req.socket.remoteAddress);
  
  // Send initial connection success
  ws.send(JSON.stringify({ 
    type: 'connection_established',
    timestamp: new Date().toISOString()
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
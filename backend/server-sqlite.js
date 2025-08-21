// Simple Local Backend for TravianAssistant
// Uses SQLite for data persistence and WebSocket for real-time updates

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite database
const db = new Database('travian.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    server_url TEXT NOT NULL,
    account_name TEXT,
    tribe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS villages (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    village_id TEXT NOT NULL,
    name TEXT NOT NULL,
    coordinates TEXT,
    is_capital INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE(account_id, village_id)
  );
  
  CREATE TABLE IF NOT EXISTS village_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resources TEXT NOT NULL,
    production TEXT NOT NULL,
    buildings TEXT,
    troops TEXT,
    population INTEGER,
    FOREIGN KEY (village_id) REFERENCES villages(id)
  );
  
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    village_id TEXT,
    data TEXT,
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_snapshots_village ON village_snapshots(village_id);
  CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON village_snapshots(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alerts_account ON alerts(account_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
`);

console.log('Database initialized');

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3002 });
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'register') {
        clients.set(data.accountId, ws);
        ws.accountId = data.accountId;
        ws.send(JSON.stringify({ type: 'registered', accountId: data.accountId }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.accountId) {
      clients.delete(ws.accountId);
    }
  });
});

// Helper functions
function broadcastToAccount(accountId, data) {
  const client = clients.get(accountId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

// API Routes

// Create or update account
app.post('/api/account', (req, res) => {
  const { accountId, serverUrl, accountName, tribe } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO accounts (id, server_url, account_name, tribe)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        server_url = excluded.server_url,
        account_name = excluded.account_name,
        tribe = excluded.tribe,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(accountId, serverUrl, accountName, tribe);
    res.json({ success: true, accountId });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync game data
app.post('/api/sync', (req, res) => {
  const { accountId, villages, timestamp } = req.body;
  
  if (!accountId || !villages) {
    return res.status(400).json({ error: 'Missing required data' });
  }
  
  try {
    const alerts = [];
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Process each village
      for (const village of villages) {
        // Upsert village
        const villageStmt = db.prepare(`
          INSERT INTO villages (id, account_id, village_id, name, coordinates)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(account_id, village_id) DO UPDATE SET
            name = excluded.name,
            coordinates = excluded.coordinates
        `);
        
        const villageDbId = `${accountId}_${village.villageId}`;
        villageStmt.run(
          villageDbId,
          accountId,
          village.villageId,
          village.villageName || 'Unknown',
          village.coordinates || ''
        );
        
        // Store snapshot
        const snapshotStmt = db.prepare(`
          INSERT INTO village_snapshots (village_id, resources, production, buildings, troops, population)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        snapshotStmt.run(
          villageDbId,
          JSON.stringify(village.resources || {}),
          JSON.stringify(village.production || {}),
          JSON.stringify(village.buildings || []),
          JSON.stringify(village.troops || []),
          village.population || 0
        );
        
        // Check for alerts
        const villageAlerts = checkForAlerts(village, accountId);
        alerts.push(...villageAlerts);
      }
      
      // Store alerts
      const alertStmt = db.prepare(`
        INSERT INTO alerts (account_id, type, severity, message, village_id, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const alert of alerts) {
        alertStmt.run(
          accountId,
          alert.type,
          alert.severity,
          alert.message,
          alert.villageId || null,
          JSON.stringify(alert.data || {})
        );
      }
    });
    
    transaction();
    
    // Broadcast updates via WebSocket
    broadcastToAccount(accountId, {
      type: 'data_synced',
      timestamp,
      villageCount: villages.length,
      alertCount: alerts.length
    });
    
    res.json({
      success: true,
      villagesUpdated: villages.length,
      alerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high')
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get account overview
app.get('/api/account/:accountId', (req, res) => {
  const { accountId } = req.params;
  
  try {
    // Get account info
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Get villages
    const villages = db.prepare('SELECT * FROM villages WHERE account_id = ?').all(accountId);
    
    // Get latest snapshots for each village
    const snapshots = {};
    for (const village of villages) {
      const snapshot = db.prepare(`
        SELECT * FROM village_snapshots 
        WHERE village_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).get(village.id);
      
      if (snapshot) {
        snapshots[village.village_id] = {
          ...snapshot,
          resources: JSON.parse(snapshot.resources),
          production: JSON.parse(snapshot.production),
          buildings: JSON.parse(snapshot.buildings || '[]'),
          troops: JSON.parse(snapshot.troops || '[]')
        };
      }
    }
    
    // Get active alerts
    const alerts = db.prepare(`
      SELECT * FROM alerts 
      WHERE account_id = ? AND resolved = 0 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(accountId);
    
    // Calculate aggregates
    const aggregates = calculateAggregates(snapshots);
    
    res.json({
      account,
      villages,
      snapshots,
      alerts,
      aggregates
    });
    
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical data
app.get('/api/history/:villageId', (req, res) => {
  const { villageId } = req.params;
  const { hours = 24 } = req.query;
  
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const snapshots = db.prepare(`
      SELECT * FROM village_snapshots
      WHERE village_id = ? AND timestamp > ?
      ORDER BY timestamp ASC
    `).all(villageId, cutoff);
    
    const parsed = snapshots.map(s => ({
      ...s,
      resources: JSON.parse(s.resources),
      production: JSON.parse(s.production)
    }));
    
    res.json(parsed);
    
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark alert as resolved
app.patch('/api/alert/:alertId/resolve', (req, res) => {
  const { alertId } = req.params;
  
  try {
    const stmt = db.prepare('UPDATE alerts SET resolved = 1 WHERE id = ?');
    const result = stmt.run(alertId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alert checking logic
function checkForAlerts(village, accountId) {
  const alerts = [];
  
  // Check resource overflow (simplified - you'd need actual warehouse capacities)
  const warehouseCapacity = 10000; // Would calculate based on warehouse level
  const granaryCapacity = 10000;
  
  ['wood', 'clay', 'iron'].forEach(resource => {
    if (village.resources && village.production) {
      const current = village.resources[resource] || 0;
      const production = village.production[resource] || 0;
      
      if (production > 0) {
        const hoursToOverflow = (warehouseCapacity - current) / production;
        
        if (hoursToOverflow < 3) {
          alerts.push({
            type: 'overflow',
            severity: hoursToOverflow < 1 ? 'critical' : 'high',
            message: `${village.villageName}: ${resource} will overflow in ${Math.round(hoursToOverflow * 60)} minutes`,
            villageId: village.villageId,
            data: { resource, hoursToOverflow }
          });
        }
      }
    }
  });
  
  // Check crop
  if (village.resources && village.production) {
    const cropCurrent = village.resources.crop || 0;
    const cropProduction = village.production.crop || 0;
    
    if (cropProduction < 0) {
      const hoursToStarvation = Math.abs(cropCurrent / cropProduction);
      
      if (hoursToStarvation < 6) {
        alerts.push({
          type: 'starvation',
          severity: hoursToStarvation < 2 ? 'critical' : 'high',
          message: `${village.villageName}: Crop will run out in ${Math.round(hoursToStarvation * 60)} minutes`,
          villageId: village.villageId,
          data: { hoursToStarvation }
        });
      }
    }
  }
  
  return alerts;
}

// Calculate aggregates
function calculateAggregates(snapshots) {
  const aggregates = {
    totalPopulation: 0,
    totalProduction: { wood: 0, clay: 0, iron: 0, crop: 0 },
    totalResources: { wood: 0, clay: 0, iron: 0, crop: 0 },
    villageCount: Object.keys(snapshots).length
  };
  
  for (const snapshot of Object.values(snapshots)) {
    aggregates.totalPopulation += snapshot.population || 0;
    
    ['wood', 'clay', 'iron', 'crop'].forEach(resource => {
      aggregates.totalProduction[resource] += snapshot.production[resource] || 0;
      aggregates.totalResources[resource] += snapshot.resources[resource] || 0;
    });
  }
  
  return aggregates;
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:3002`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
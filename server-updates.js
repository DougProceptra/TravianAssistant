// Add this endpoint to server.js for game mechanics context

app.post('/api/game-mechanics-context', (req, res) => {
  try {
    const { query, tribe, villages } = req.body;
    
    const context = {
      buildings: [],
      troops: [],
      tips: []
    };
    
    // Detect what mechanics are relevant based on query
    if (query.match(/settle|village|culture|CP/i)) {
      context.buildings = db.prepare(`
        SELECT * FROM buildings 
        WHERE id IN ('residence', 'palace', 'town_hall', 'command_center')
      `).all().map(b => ({
        ...b,
        costs: JSON.parse(b.costs || '{}'),
        benefits: JSON.parse(b.benefits || '{}')
      }));
      
      context.tips.push('For 2x server: Aim for settlement by day 7');
      context.tips.push('You need 3 settlers from Residence/Palace');
      context.tips.push('Culture points needed: ' + (villages < 3 ? '10000' : '20000+'));
    }
    
    if (query.match(/troop|army|attack|defense/i)) {
      context.troops = db.prepare(`
        SELECT * FROM troops 
        WHERE tribe = ?
        LIMIT 10
      `).all(tribe || 'romans').map(t => ({
        ...t,
        costs: JSON.parse(t.costs || '{}')
      }));
    }
    
    if (query.match(/hero/i)) {
      context.tips.push('Hero resource production: 100 points = 2400/hour per resource when distributed evenly');
      context.tips.push('Or 8000/hour when focused on single resource');
    }
    
    res.json(context);
    
  } catch (error) {
    console.error('❌ Game mechanics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the village save endpoint to use userId instead of accountId
app.post('/api/village', (req, res) => {
  try {
    const { userId, village } = req.body;  // Changed from accountId
    
    if (!userId || !village) {
      return res.status(400).json({ error: 'Missing userId or village data' });
    }
    
    const id = `${userId}_${village.id || Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_villages (
        id, account_id, village_id, village_name, x, y, population,
        resources, production, buildings, troops, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      userId,  // Now using hashed email as userId
      village.id || 'unknown',
      village.name,
      village.coordinates?.x || 0,
      village.coordinates?.y || 0,
      village.population || 0,
      JSON.stringify(village.resources || {}),
      JSON.stringify(village.production || {}),
      JSON.stringify(village.buildings || []),
      JSON.stringify(village.troops || [])
    );
    
    console.log(`✅ Saved village data for ${userId.substring(0, 10)}...`);
    res.json({ success: true, id });
    
  } catch (error) {
    console.error('❌ Village save error:', error);
    res.status(500).json({ error: error.message });
  }
});
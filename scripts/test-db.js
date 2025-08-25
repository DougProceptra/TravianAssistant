const Database = require('better-sqlite3');
const path = require('path');

// Test database connection and show statistics
const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');

try {
  const db = new Database(dbPath);
  
  console.log('✅ Database connection successful!\n');
  
  // Get table statistics
  const tables = [
    'villages', 'players', 'alliances', 
    'game_events', 'recommendations', 
    'user_villages', 'game_start_progress'
  ];
  
  console.log('📊 Database Statistics:');
  console.log('═'.repeat(40));
  
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ${table.padEnd(20)} : ${count.count} records`);
    } catch (err) {
      console.log(`  ${table.padEnd(20)} : ❌ Table not found`);
    }
  });
  
  // Check if map data exists
  try {
    const mapDataCheck = db.prepare(`
      SELECT 
        COUNT(DISTINCT player_id) as players,
        COUNT(*) as villages
      FROM villages 
      WHERE player_id > 0
    `).get();
    
    console.log('\n🗺️ Map Data:');
    console.log('═'.repeat(40));
    console.log(`  Active Players      : ${mapDataCheck.players}`);
    console.log(`  Player Villages     : ${mapDataCheck.villages}`);
  } catch (err) {
    console.log('\n⚠️ Map data not yet imported');
  }
  
  // Check game start progress
  try {
    const gameStart = db.prepare('SELECT * FROM game_start_progress WHERE id = 1').get();
    if (gameStart) {
      console.log('\n🎮 Game Start Status:');
      console.log('═'.repeat(40));
      console.log(`  Current Phase       : ${gameStart.current_phase}`);
      console.log(`  Hours Elapsed       : ${gameStart.hours_elapsed}`);
      const strategy = JSON.parse(gameStart.strategy_notes || '{}');
      console.log(`  Strategy            : ${strategy.strategy || 'Not set'}`);
    }
  } catch (err) {
    console.log('\n⚠️ Game start tracker not initialized');
  }
  
  db.close();
  console.log('\n✨ Database test complete!');
  
} catch (err) {
  console.error('❌ Database error:', err.message);
  process.exit(1);
}

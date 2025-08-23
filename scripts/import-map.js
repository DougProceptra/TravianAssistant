const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance during import
db.pragma('journal_mode = WAL');

async function downloadMapSql() {
  const serverUrl = process.env.SERVER_URL || 'https://lusobr.x2.lusobrasileiro.travian.com';
  const mapUrl = `${serverUrl}/map.sql.gz`;
  
  console.log(`📥 Downloading map.sql from ${mapUrl}...`);
  
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(__dirname, '..', 'data', 'map.sql.gz');
    const tmpDir = path.dirname(tmpFile);
    
    // Ensure data directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const file = fs.createWriteStream(tmpFile);
    
    https.get(mapUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}% (${downloaded}/${totalSize} bytes)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Download complete!');
        
        // Decompress the file
        console.log('📦 Decompressing...');
        const gunzip = zlib.createGunzip();
        const input = fs.createReadStream(tmpFile);
        const output = fs.createWriteStream(tmpFile.replace('.gz', ''));
        
        input.pipe(gunzip).pipe(output);
        
        output.on('finish', () => {
          console.log('✅ Decompression complete!');
          resolve(tmpFile.replace('.gz', ''));
        });
      });
    }).on('error', reject);
  });
}

function parseMapSql(filePath) {
  console.log('🔍 Parsing map.sql...');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Prepare statements
  const insertVillage = db.prepare(`
    INSERT OR REPLACE INTO villages (id, x, y, vid, name, player_id, population)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertPlayer = db.prepare(`
    INSERT OR REPLACE INTO players (id, name, alliance_id, population, villages)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertAlliance = db.prepare(`
    INSERT OR REPLACE INTO alliances (id, name, tag, members)
    VALUES (?, ?, ?, ?)
  `);
  
  let villageCount = 0;
  let playerCount = 0;
  let allianceCount = 0;
  
  // Begin transaction for performance
  const importTransaction = db.transaction(() => {
    lines.forEach(line => {
      line = line.trim();
      
      // Parse INSERT statements
      if (line.startsWith('INSERT INTO `x_world`')) {
        // Villages data
        const matches = line.matchAll(/\(([^)]+)\)/g);
        for (const match of matches) {
          const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
          if (values.length >= 7) {
            const [id, x, y, tribe, vid, village, uid] = values;
            const pop = values[6] || 0;
            insertVillage.run(id, parseInt(x), parseInt(y), parseInt(vid), village, parseInt(uid), parseInt(pop));
            villageCount++;
          }
        }
      } else if (line.startsWith('INSERT INTO `x_player`')) {
        // Player data
        const matches = line.matchAll(/\(([^)]+)\)/g);
        for (const match of matches) {
          const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
          if (values.length >= 5) {
            const [id, name, aid, villages, population] = values;
            insertPlayer.run(parseInt(id), name, parseInt(aid) || null, parseInt(population), parseInt(villages));
            playerCount++;
          }
        }
      } else if (line.startsWith('INSERT INTO `x_alliance`')) {
        // Alliance data
        const matches = line.matchAll(/\(([^)]+)\)/g);
        for (const match of matches) {
          const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
          if (values.length >= 4) {
            const [id, name, tag, members] = values;
            insertAlliance.run(parseInt(id), name, tag, parseInt(members));
            allianceCount++;
          }
        }
      }
    });
  });
  
  console.log('💾 Importing data...');
  importTransaction();
  
  console.log(`
✅ Import complete!
  - Villages: ${villageCount}
  - Players: ${playerCount}
  - Alliances: ${allianceCount}
  `);
  
  // Update last_updated timestamps
  db.exec(`
    UPDATE villages SET last_updated = datetime('now');
    UPDATE players SET last_updated = datetime('now');
    UPDATE alliances SET last_updated = datetime('now');
  `);
}

async function main() {
  try {
    console.log('🚀 Starting map.sql import process...\n');
    
    // Download and decompress
    const mapSqlPath = await downloadMapSql();
    
    // Parse and import
    parseMapSql(mapSqlPath);
    
    // Clean up temporary files
    console.log('🧹 Cleaning up temporary files...');
    fs.unlinkSync(mapSqlPath);
    fs.unlinkSync(mapSqlPath + '.gz');
    
    // Show some statistics
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM villages) as villages,
        (SELECT COUNT(*) FROM players) as players,
        (SELECT COUNT(*) FROM alliances) as alliances,
        (SELECT COUNT(*) FROM villages WHERE player_id = 0) as oases
    `).get();
    
    console.log(`
📊 Database Statistics:
  - Total Villages: ${stats.villages}
  - Total Players: ${stats.players}
  - Total Alliances: ${stats.alliances}
  - Oases: ${stats.oases}
  
🎯 Ready for analysis!
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { downloadMapSql, parseMapSql };

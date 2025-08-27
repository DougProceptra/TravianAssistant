#!/usr/bin/env node

/**
 * TravianAssistant V3 - Map Data Importer
 * Fetches and imports map.sql from Travian server
 * Run manually or scheduled via cron
 */

const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  server: 'lusobr.x2.lusobrasileiro.travian.com',
  dbPath: path.join(__dirname, '..', 'travian.db'),
  mapCachePath: path.join(__dirname, '..', 'data', 'map.sql'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

class MapImporter {
  constructor() {
    this.db = new Database(CONFIG.dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  async fetchMapData() {
    const url = `https://${CONFIG.server}/map.sql`;
    console.log(`📡 Fetching map data from: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': CONFIG.userAgent,
          'Accept': 'text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.text();
      console.log(`✅ Downloaded ${(data.length / 1024).toFixed(2)} KB of map data`);
      
      // Cache the raw data
      await fs.mkdir(path.dirname(CONFIG.mapCachePath), { recursive: true });
      await fs.writeFile(CONFIG.mapCachePath, data);
      console.log(`💾 Cached map data to: ${CONFIG.mapCachePath}`);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch map data:', error.message);
      
      // Try to use cached data
      try {
        const cached = await fs.readFile(CONFIG.mapCachePath, 'utf8');
        console.log('📂 Using cached map data');
        return cached;
      } catch (cacheError) {
        throw new Error('No map data available (fetch failed, no cache)');
      }
    }
  }

  parseMapSQL(sql) {
    console.log('🔍 Parsing SQL data...');
    
    // Extract CREATE TABLE statement
    const createMatch = sql.match(/CREATE TABLE[^;]+;/i);
    if (!createMatch) {
      throw new Error('No CREATE TABLE statement found');
    }

    // Extract column names from CREATE TABLE
    const columnMatch = createMatch[0].match(/\(([\s\S]+)\)/);
    if (!columnMatch) {
      throw new Error('Could not parse table columns');
    }

    const columns = columnMatch[1]
      .split(',')
      .map(col => col.trim().split(/\s+/)[0].replace(/`/g, ''));
    
    console.log(`📊 Found columns: ${columns.join(', ')}`);

    // Extract INSERT statements
    const inserts = sql.match(/INSERT INTO[^;]+;/gi) || [];
    console.log(`📝 Found ${inserts.length} INSERT statements`);

    const villages = [];
    
    for (const insert of inserts) {
      // Extract values from INSERT statement
      const valuesMatch = insert.match(/VALUES\s*\(([\s\S]+)\)/i);
      if (!valuesMatch) continue;
      
      // Parse each row of values
      const rowsString = valuesMatch[1];
      const rows = this.parseValueRows(rowsString);
      
      for (const row of rows) {
        if (row.length === columns.length) {
          const village = {};
          columns.forEach((col, i) => {
            village[col] = row[i];
          });
          villages.push(village);
        }
      }
    }

    console.log(`✅ Parsed ${villages.length} villages`);
    return villages;
  }

  parseValueRows(str) {
    const rows = [];
    let current = [];
    let inString = false;
    let escaped = false;
    let buffer = '';
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (escaped) {
        buffer += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        buffer += char;
        continue;
      }

      if (char === "'" && !inString) {
        inString = true;
        buffer += char;
      } else if (char === "'" && inString) {
        inString = false;
        buffer += char;
      } else if (char === '(' && !inString) {
        depth++;
        if (depth === 1) {
          // Start of a new row
          current = [];
          buffer = '';
        } else {
          buffer += char;
        }
      } else if (char === ')' && !inString) {
        depth--;
        if (depth === 0) {
          // End of a row
          if (buffer.trim()) {
            current.push(this.cleanValue(buffer.trim()));
          }
          rows.push(current);
          buffer = '';
        } else {
          buffer += char;
        }
      } else if (char === ',' && !inString && depth === 1) {
        // End of a field
        current.push(this.cleanValue(buffer.trim()));
        buffer = '';
      } else {
        buffer += char;
      }
    }

    return rows;
  }

  cleanValue(val) {
    // Remove quotes and handle NULL
    if (val === 'NULL') return null;
    if (val.startsWith("'") && val.endsWith("'")) {
      return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    }
    // Parse numbers
    if (/^\d+$/.test(val)) {
      return parseInt(val, 10);
    }
    return val;
  }

  async importToDatabase(villages) {
    console.log('💾 Importing to database...');
    
    const transaction = this.db.transaction((villages) => {
      // Clear old data
      this.db.prepare('DELETE FROM villages').run();
      
      // Prepare insert statement
      const stmt = this.db.prepare(`
        INSERT INTO villages (
          id, x, y, tid, vid, village, uid, player, aid, alliance, population
        ) VALUES (
          @id, @x, @y, @tid, @vid, @village, @uid, @player, @aid, @alliance, @population
        )
      `);

      let imported = 0;
      for (const v of villages) {
        try {
          stmt.run({
            id: v.id || null,
            x: v.x || 0,
            y: v.y || 0,
            tid: v.tid || v.tribe || null,
            vid: v.vid || null,
            village: v.village || v.name || null,
            uid: v.uid || null,
            player: v.player || null,
            aid: v.aid || null,
            alliance: v.alliance || null,
            population: v.population || v.pop || null
          });
          imported++;
        } catch (error) {
          console.warn(`⚠️ Skipped village:`, error.message);
        }
      }
      
      console.log(`✅ Imported ${imported}/${villages.length} villages`);
      return imported;
    });

    return transaction(villages);
  }

  async getStats() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_villages,
        COUNT(DISTINCT uid) as total_players,
        COUNT(DISTINCT aid) as total_alliances,
        MAX(population) as max_population,
        AVG(population) as avg_population
      FROM villages
    `).get();

    console.log('\n📈 Map Statistics:');
    console.log(`   Villages: ${stats.total_villages}`);
    console.log(`   Players: ${stats.total_players}`);
    console.log(`   Alliances: ${stats.total_alliances}`);
    console.log(`   Max Population: ${stats.max_population}`);
    console.log(`   Avg Population: ${Math.round(stats.avg_population)}`);
    
    return stats;
  }

  async run() {
    console.log('🚀 TravianAssistant V3 - Map Importer');
    console.log('=====================================');
    console.log(`Server: ${CONFIG.server}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
      // Fetch map data
      const mapSQL = await this.fetchMapData();
      
      // Parse SQL
      const villages = this.parseMapSQL(mapSQL);
      
      // Import to database
      await this.importToDatabase(villages);
      
      // Show statistics
      await this.getStats();
      
      console.log('\n✅ Map import completed successfully!');
    } catch (error) {
      console.error('❌ Map import failed:', error);
      process.exit(1);
    } finally {
      this.db.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  new MapImporter().run();
}

module.exports = MapImporter;

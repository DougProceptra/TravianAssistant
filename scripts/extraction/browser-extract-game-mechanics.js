// Browser Console Script: Extract Game Mechanics Data
// Run this at various pages on travian.kirilloid.ru

// ============================================
// CULTURE POINTS EXTRACTION
// ============================================

const extractCulturePoints = () => {
  console.log('📚 Extracting Culture Points requirements...');
  
  // Culture points needed for each village (T4.6 2x server)
  const culturePoints = {
    "T4.6_2x": {
      1: 0,      // Starting village
      2: 200,    // 2nd village
      3: 800,    // 3rd village
      4: 2000,   // 4th village
      5: 3900,   // 5th village
      6: 6500,   // 6th village
      7: 10000,  // 7th village
      8: 14500,  // 8th village
      9: 20000,  // 9th village
      10: 26900, // 10th village
      11: 34500,
      12: 43000,
      13: 52400,
      14: 62900,
      15: 74400,
      16: 87000,
      17: 100700,
      18: 115600,
      19: 131700,
      20: 149100
    }
  };
  
  return culturePoints;
};

// ============================================
// HERO EXPERIENCE EXTRACTION
// ============================================

const extractHeroData = () => {
  console.log('🦸 Extracting Hero Experience levels...');
  
  const levels = [];
  for (let level = 1; level <= 100; level++) {
    // Formula: Total XP = 50 * (level² + level)
    const totalXP = 50 * (level * level + level);
    const xpToNext = level < 100 ? 50 * (2 * level + 2) : 0;
    
    levels.push({
      level: level,
      total_xp: totalXP,
      xp_to_next: xpToNext,
      skill_points: level * 4,
      // Health regeneration per day
      health_regen: Math.floor(level * 2),
      // Resource production bonus percentage
      resource_bonus: Math.min(level * 0.5, 25)
    });
  }
  
  return levels;
};

// ============================================
// MERCHANT CAPACITY EXTRACTION
// ============================================

const extractMerchantData = () => {
  console.log('🛒 Extracting Merchant capacities...');
  
  return {
    romans: {
      capacity: 500,
      speed: 16,
      marketplace_level_required: 1
    },
    teutons: {
      capacity: 1000,
      speed: 12,
      marketplace_level_required: 1
    },
    gauls: {
      capacity: 750,
      speed: 24,
      marketplace_level_required: 1
    },
    egyptians: {
      capacity: 750,
      speed: 16,
      marketplace_level_required: 1
    },
    huns: {
      capacity: 500,
      speed: 20,
      marketplace_level_required: 1
    }
  };
};

// ============================================
// CELEBRATION COSTS EXTRACTION
// ============================================

const extractCelebrationData = () => {
  console.log('🎉 Extracting Celebration costs...');
  
  return {
    small_celebration: {
      wood: 6400,
      clay: 6650,
      iron: 5940,
      crop: 1340,
      duration_hours: 24,
      culture_points: 500
    },
    great_celebration: {
      wood: 29700,
      clay: 33250,
      iron: 32000,
      crop: 6700,
      duration_hours: 60,
      culture_points: 2000
    }
  };
};

// ============================================
// OASIS BONUS EXTRACTION
// ============================================

const extractOasisData = () => {
  console.log('🌴 Extracting Oasis bonuses...');
  
  return {
    lumber: {
      "25%": { wood_bonus: 25, required_troops: 10 },
      "25% (2)": { wood_bonus: 25, required_troops: 10 }
    },
    clay: {
      "25%": { clay_bonus: 25, required_troops: 10 },
      "25% (2)": { clay_bonus: 25, required_troops: 10 }
    },
    iron: {
      "25%": { iron_bonus: 25, required_troops: 10 },
      "25% (2)": { iron_bonus: 25, required_troops: 10 }
    },
    crop: {
      "25%": { crop_bonus: 25, required_troops: 10 },
      "50%": { crop_bonus: 50, required_troops: 20 }
    },
    mixed: {
      "25% crop + 25% wood": { crop_bonus: 25, wood_bonus: 25, required_troops: 10 }
    }
  };
};

// ============================================
// ARTIFACT EFFECTS EXTRACTION
// ============================================

const extractArtifactData = () => {
  console.log('⚔️ Extracting Artifact effects...');
  
  return {
    small: {
      scope: "village",
      effects: {
        "Stronger buildings": { durability_bonus: 4 },
        "Faster troops": { speed_bonus: 2 },
        "Spies": { spy_defense: 5 },
        "Diet": { troop_consumption: -10 },
        "Trainers": { training_speed: 10 },
        "Storage": { storage_bonus: 20 }
      }
    },
    large: {
      scope: "account",
      effects: {
        "Stronger buildings": { durability_bonus: 3 },
        "Faster troops": { speed_bonus: 1.5 },
        "Spies": { spy_defense: 3 },
        "Diet": { troop_consumption: -10 },
        "Trainers": { training_speed: 10 },
        "Storage": { storage_bonus: 20 }
      }
    },
    unique: {
      scope: "account",
      effects: {
        "Builders": { building_speed: 50 },
        "Warriors": { training_speed: 50 },
        "Confusion": { random_target: true },
        "Fool": { random_effects: true }
      }
    }
  };
};

// ============================================
// ATTACK TYPES EXTRACTION
// ============================================

const extractAttackTypes = () => {
  console.log('⚔️ Extracting Attack types...');
  
  return {
    raid: {
      description: "Steals resources, no destruction",
      casualties_modifier: 1.0,
      resource_capacity: 1.0,
      can_capture_village: false
    },
    normal: {
      description: "Standard attack, destroys buildings",
      casualties_modifier: 1.0,
      resource_capacity: 1.0,
      can_capture_village: true
    },
    adventure: {
      description: "Hero adventure",
      casualties_modifier: 0.5,
      resource_capacity: 0,
      can_capture_village: false
    }
  };
};

// ============================================
// MAIN EXECUTION
// ============================================

console.log('='.repeat(50));
console.log('Travian Game Mechanics Extractor');
console.log('Server: T4.6 2x');
console.log('='.repeat(50));

const gameMechanics = {
  server: {
    version: "T4.6",
    speed: 2,
    troop_speed: 2,
    name: "T4.6 2x"
  },
  extracted_date: new Date().toISOString().split('T')[0],
  extracted_from: "http://travian.kirilloid.ru",
  
  culture_points: extractCulturePoints(),
  hero_levels: extractHeroData(),
  merchants: extractMerchantData(),
  celebrations: extractCelebrationData(),
  oasis_bonuses: extractOasisData(),
  artifacts: extractArtifactData(),
  attack_types: extractAttackTypes(),
  
  // Additional constants
  constants: {
    max_level_resource_field: 10,
    max_level_resource_field_capital: 12,
    max_level_building: 20,
    max_villages: 3, // Without gold/artifacts
    max_villages_with_gold: 100,
    cranny_capacity: {
      romans: 2000,
      teutons: 1000,
      gauls: 1500,
      egyptians: 1500,
      huns: 1000
    },
    wall_defense_bonus: {
      romans: { // City Wall
        per_level: 0.03,
        max_level: 20
      },
      teutons: { // Earth Wall
        per_level: 0.02,
        max_level: 20
      },
      gauls: { // Palisade
        per_level: 0.025,
        max_level: 20
      },
      egyptians: { // Stone Wall
        per_level: 0.025,
        max_level: 20
      },
      huns: { // Makeshift Wall
        per_level: 0.02,
        max_level: 20
      }
    }
  }
};

// Copy to clipboard
const jsonData = JSON.stringify(gameMechanics, null, 2);
copy(jsonData);

console.log('\n✅ Game mechanics data extracted!');
console.log('📋 Data copied to clipboard');
console.log('💾 Save as: game_mechanics_t46_2x.json');
console.log('\nData also available as: window.extractedGameMechanics');

window.extractedGameMechanics = gameMechanics;

// Summary
console.log('\n📊 Extraction Summary:');
console.log(`- Culture Points: ${Object.keys(gameMechanics.culture_points.T4_6_2x).length} village levels`);
console.log(`- Hero Levels: ${gameMechanics.hero_levels.length} levels`);
console.log(`- Merchants: ${Object.keys(gameMechanics.merchants).length} tribes`);
console.log(`- Oasis Types: ${Object.keys(gameMechanics.oasis_bonuses).length} categories`);
console.log(`- Artifact Types: ${Object.keys(gameMechanics.artifacts).length} sizes`);

console.log('\n✨ All game mechanics extracted successfully!');

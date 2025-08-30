/**
 * TravianAssistant V3 - Game Start Optimizer
 * Achieves top-5 settler status through optimal opening sequence
 * Target: Settlement in <168 hours (7 days)
 */

const Database = require('better-sqlite3');
const path = require('path');

class GameStartOptimizer {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, '..', 'data', 'travian-v3.db');
    this.db = new Database(this.dbPath);
    this.tribe = 'egyptians';
    this.serverSpeed = 2;
    
    // Phases with exact timings for 2x speed server
    this.PHASES = {
      INITIAL: { 
        hours: [0, 24],
        focus: 'Resource fields to level 2, complete all tutorial quests',
        goldStrategy: 'Save for Day 2 NPC trader'
      },
      ACCELERATION: { 
        hours: [24, 72],
        focus: 'Push crop to level 5, other resources to 3-4',
        goldStrategy: 'NPC for balanced growth, 25% bonus on critical fields'
      },
      CP_RUSH: { 
        hours: [72, 144],
        focus: 'Build CP buildings: Main Building, Marketplace, Embassy',
        goldStrategy: 'Instant complete CP buildings for 500 CP threshold'
      },
      SETTLEMENT: { 
        hours: [144, 168],
        focus: 'Train 3 settlers, research target location',
        goldStrategy: 'Instant finish settlers if behind schedule'
      }
    };

    // Optimal field development order for Egyptians (waterworks bonus)
    this.FIELD_SEQUENCE = [
      // Hour 0-12: Foundation
      { hour: 0, resource: 'cropland', fieldId: 1, targetLevel: 1 },
      { hour: 1, resource: 'woodcutter', fieldId: 1, targetLevel: 1 },
      { hour: 2, resource: 'clay_pit', fieldId: 1, targetLevel: 1 },
      { hour: 3, resource: 'iron_mine', fieldId: 1, targetLevel: 1 },
      
      // Hour 12-24: Balance
      { hour: 12, resource: 'cropland', fieldId: 2, targetLevel: 2 },
      { hour: 14, resource: 'cropland', fieldId: 3, targetLevel: 2 },
      { hour: 16, resource: 'woodcutter', fieldId: 2, targetLevel: 2 },
      { hour: 18, resource: 'clay_pit', fieldId: 2, targetLevel: 2 },
      
      // Hour 24-48: Crop focus
      { hour: 24, resource: 'cropland', fieldId: 1, targetLevel: 3 },
      { hour: 28, resource: 'cropland', fieldId: 2, targetLevel: 3 },
      { hour: 32, resource: 'cropland', fieldId: 3, targetLevel: 3 },
      { hour: 36, resource: 'waterworks', fieldId: 1, targetLevel: 1 }, // Egyptian bonus!
      
      // Hour 48-72: Push for production
      { hour: 48, resource: 'cropland', fieldId: 1, targetLevel: 4 },
      { hour: 52, resource: 'cropland', fieldId: 2, targetLevel: 4 },
      { hour: 56, resource: 'woodcutter', fieldId: 1, targetLevel: 3 },
      { hour: 60, resource: 'clay_pit', fieldId: 1, targetLevel: 3 },
      { hour: 64, resource: 'iron_mine', fieldId: 1, targetLevel: 3 },
      { hour: 68, resource: 'cropland', fieldId: 1, targetLevel: 5 },
      
      // Hour 72+: CP Buildings
      { hour: 72, resource: 'main_building', fieldId: 0, targetLevel: 10 },
      { hour: 80, resource: 'marketplace', fieldId: 0, targetLevel: 1 },
      { hour: 84, resource: 'warehouse', fieldId: 0, targetLevel: 5 },
      { hour: 88, resource: 'granary', fieldId: 0, targetLevel: 5 },
      { hour: 96, resource: 'embassy', fieldId: 0, targetLevel: 1 },
      { hour: 120, resource: 'residence', fieldId: 0, targetLevel: 10 }
    ];
  }

  /**
   * Get current phase based on server age
   */
  getCurrentPhase(serverAgeHours) {
    for (const [phaseName, phaseData] of Object.entries(this.PHASES)) {
      if (serverAgeHours >= phaseData.hours[0] && serverAgeHours < phaseData.hours[1]) {
        return { name: phaseName, ...phaseData };
      }
    }
    return { name: 'SETTLEMENT', ...this.PHASES.SETTLEMENT };
  }

  /**
   * Analyze current game state and provide next actions
   */
  analyzeGameState(gameState) {
    const serverAge = this.calculateServerAge(gameState.serverStart);
    const currentPhase = this.getCurrentPhase(serverAge);
    const recommendations = [];
    
    // Check building queue
    if (!gameState.buildingQueue || gameState.buildingQueue.length === 0) {
      const nextBuilding = this.getNextBuilding(gameState, serverAge);
      recommendations.push({
        priority: 1,
        type: 'BUILD',
        action: nextBuilding,
        reasoning: `Empty building queue in ${currentPhase.name} phase`
      });
    }
    
    // Check resource balance for NPC
    if (this.shouldUseNPC(gameState)) {
      recommendations.push({
        priority: 2,
        type: 'NPC_TRADE',
        action: this.calculateNPCTrade(gameState),
        reasoning: 'Resource imbalance detected - NPC will optimize growth'
      });
    }
    
    // Check CP progress
    const cpStatus = this.analyzeCulturePoints(gameState);
    if (cpStatus.behind) {
      recommendations.push({
        priority: 1,
        type: 'CP_BOOST',
        action: cpStatus.action,
        reasoning: `Behind CP schedule: ${cpStatus.current}/500 needed by hour 144`
      });
    }
    
    // Check for settlement readiness
    if (serverAge > 140 && !gameState.hasSettlers) {
      recommendations.push({
        priority: 1,
        type: 'TRAIN_SETTLERS',
        action: { building: 'residence', units: 3 },
        reasoning: 'Must start settler training immediately for <168 hour settlement'
      });
    }
    
    return {
      phase: currentPhase,
      serverAge: serverAge,
      recommendations: recommendations.sort((a, b) => a.priority - b.priority),
      timeline: this.getTimeline(serverAge)
    };
  }

  /**
   * Get next building based on optimal sequence
   */
  getNextBuilding(gameState, serverAge) {
    // Find next item in sequence
    for (const item of this.FIELD_SEQUENCE) {
      if (item.hour <= serverAge) {
        const currentLevel = this.getBuildingLevel(gameState, item.resource, item.fieldId);
        if (currentLevel < item.targetLevel) {
          const costs = this.getBuildingCosts(item.resource, currentLevel + 1);
          const time = this.getBuildingTime(item.resource, currentLevel + 1, gameState.mainBuildingLevel);
          
          return {
            building: item.resource,
            fieldId: item.fieldId,
            fromLevel: currentLevel,
            toLevel: currentLevel + 1,
            costs: costs,
            timeMinutes: Math.round(time / 60),
            canAfford: this.canAfford(gameState.resources, costs)
          };
        }
      }
    }
    
    // Fallback: upgrade lowest resource field
    return this.suggestFieldUpgrade(gameState);
  }

  /**
   * Calculate if NPC trader should be used
   */
  shouldUseNPC(gameState) {
    const res = gameState.resources;
    const total = res.wood + res.clay + res.iron + res.crop;
    
    if (total < 1000) return false; // Not worth it yet
    
    // Check for significant imbalance
    const avg = total / 4;
    const imbalance = Math.max(
      Math.abs(res.wood - avg),
      Math.abs(res.clay - avg),
      Math.abs(res.iron - avg),
      Math.abs(res.crop - avg)
    );
    
    return imbalance > avg * 0.5; // 50% deviation triggers NPC
  }

  /**
   * Calculate optimal NPC trade
   */
  calculateNPCTrade(gameState) {
    const res = gameState.resources;
    const total = res.wood + res.clay + res.iron + res.crop;
    const target = Math.floor(total / 4);
    
    return {
      wood: target,
      clay: target,
      iron: target,
      crop: target,
      goldCost: 3, // NPC trader cost
      reasoning: `Balance resources to ${target} each for optimal growth`
    };
  }

  /**
   * Analyze culture point progress
   */
  analyzeCulturePoints(gameState) {
    const currentCP = gameState.culturePoints || 0;
    const serverAge = this.calculateServerAge(gameState.serverStart);
    const targetCP = serverAge < 144 ? (serverAge / 144) * 500 : 500;
    
    const behind = currentCP < targetCP * 0.8; // 20% behind schedule
    
    let action = null;
    if (behind) {
      if (gameState.canCelebrate) {
        action = { 
          type: 'small_celebration',
          cost: this.getCelebrationCost(gameState.mainBuildingLevel),
          cpGain: 500
        };
      } else {
        action = {
          type: 'build_cp_building',
          options: ['main_building', 'marketplace', 'embassy'],
          urgency: 'high'
        };
      }
    }
    
    return {
      current: currentCP,
      target: 500,
      progress: (currentCP / 500) * 100,
      behind: behind,
      action: action
    };
  }

  /**
   * Get building costs from database
   */
  getBuildingCosts(building, level) {
    const data = this.db.prepare(`
      SELECT wood_cost, clay_cost, iron_cost, crop_cost 
      FROM game_data_buildings 
      WHERE building_name = ? AND level = ?
      AND server_version = 'T4.6' AND server_speed = ?
    `).get(building, level, this.serverSpeed);
    
    return data || { wood: 100, clay: 100, iron: 100, crop: 100 };
  }

  /**
   * Calculate building time with Main Building bonus
   */
  getBuildingTime(building, level, mainBuildingLevel = 1) {
    const baseTime = this.db.prepare(`
      SELECT time_seconds FROM game_data_buildings 
      WHERE building_name = ? AND level = ?
    `).get(building, level)?.time_seconds || 1800;
    
    // Main Building reduces time by 3% per level
    const reduction = 1 - (mainBuildingLevel * 0.03);
    return Math.round(baseTime * reduction);
  }

  /**
   * Helper functions
   */
  calculateServerAge(serverStart) {
    const now = Date.now();
    const start = new Date(serverStart).getTime();
    return Math.floor((now - start) / (1000 * 60 * 60)); // Hours
  }

  getBuildingLevel(gameState, building, fieldId) {
    const buildings = gameState.buildings || {};
    const key = fieldId > 0 ? `${building}_${fieldId}` : building;
    return buildings[key]?.level || 0;
  }

  canAfford(resources, costs) {
    return resources.wood >= costs.wood &&
           resources.clay >= costs.clay &&
           resources.iron >= costs.iron &&
           resources.crop >= costs.crop;
  }

  getCelebrationCost(mainBuildingLevel) {
    const base = 6400 / this.serverSpeed;
    const reduction = 1 - (mainBuildingLevel * 0.03);
    return Math.round(base * reduction);
  }

  suggestFieldUpgrade(gameState) {
    // Find lowest level resource field
    const fields = ['cropland', 'woodcutter', 'clay_pit', 'iron_mine'];
    let lowest = { field: null, level: 99 };
    
    fields.forEach(field => {
      for (let i = 1; i <= 4; i++) {
        const level = this.getBuildingLevel(gameState, field, i);
        if (level < lowest.level) {
          lowest = { field, fieldId: i, level };
        }
      }
    });
    
    return {
      building: lowest.field,
      fieldId: lowest.fieldId,
      fromLevel: lowest.level,
      toLevel: lowest.level + 1,
      reasoning: 'Upgrade lowest resource field for balanced growth'
    };
  }

  /**
   * Get timeline of upcoming milestones
   */
  getTimeline(currentHour) {
    const milestones = [
      { hour: 24, event: 'Complete initial quests, start resource focus' },
      { hour: 48, event: 'Reach 150+ resource/hour production' },
      { hour: 72, event: 'Begin CP building phase' },
      { hour: 96, event: 'Achieve 300+ culture points' },
      { hour: 120, event: 'Residence level 10, prepare settlers' },
      { hour: 144, event: 'Train 3 settlers' },
      { hour: 168, event: 'SETTLE SECOND VILLAGE' }
    ];
    
    return milestones.filter(m => m.hour > currentHour).slice(0, 3);
  }

  /**
   * Generate complete strategy report
   */
  generateStrategyReport(gameState) {
    const analysis = this.analyzeGameState(gameState);
    
    return {
      executive_summary: `Server age: ${analysis.serverAge}h, Phase: ${analysis.phase.name}`,
      current_focus: analysis.phase.focus,
      gold_strategy: analysis.phase.goldStrategy,
      immediate_actions: analysis.recommendations.slice(0, 3),
      upcoming_milestones: analysis.timeline,
      settlement_readiness: {
        cp_progress: `${gameState.culturePoints || 0}/500`,
        estimated_settlement: analysis.serverAge < 144 ? 'On track' : 'At risk',
        bottlenecks: this.identifyBottlenecks(gameState)
      },
      optimization_tips: this.getOptimizationTips(analysis.phase.name)
    };
  }

  identifyBottlenecks(gameState) {
    const bottlenecks = [];
    
    if ((gameState.resources?.crop || 0) < 200) {
      bottlenecks.push('Low crop - limits troop production');
    }
    
    if (!gameState.buildingQueue || gameState.buildingQueue.length === 0) {
      bottlenecks.push('Empty building queue - wasting time');
    }
    
    if ((gameState.culturePoints || 0) < 300 && this.calculateServerAge(gameState.serverStart) > 96) {
      bottlenecks.push('Behind on culture points - risk missing settlement window');
    }
    
    return bottlenecks;
  }

  getOptimizationTips(phaseName) {
    const tips = {
      INITIAL: [
        'Complete ALL tutorial quests for free resources',
        'Focus on one of each resource field to level 2',
        'Save gold for Day 2 NPC trader'
      ],
      ACCELERATION: [
        'Push crop fields aggressively - needed for settlers',
        'Use NPC to balance resources every 12 hours',
        'Complete adventure for hero items and resources'
      ],
      CP_RUSH: [
        'Main Building to 10 is priority #1',
        'Small celebration if you have resources',
        'Embassy gives good CP for low cost'
      ],
      SETTLEMENT: [
        'Scout your settlement location NOW',
        '15-cropper within 20 fields is ideal',
        'Have resources ready: 750 each type'
      ]
    };
    
    return tips[phaseName] || tips.SETTLEMENT;
  }
}

module.exports = GameStartOptimizer;

// CLI interface for testing
if (require.main === module) {
  const optimizer = new GameStartOptimizer();
  
  // Sample game state for testing
  const sampleState = {
    serverStart: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
    resources: { wood: 500, clay: 400, iron: 300, crop: 250 },
    buildings: {
      cropland_1: { level: 3 },
      woodcutter_1: { level: 2 },
      clay_pit_1: { level: 2 },
      iron_mine_1: { level: 1 },
      main_building: { level: 5 }
    },
    buildingQueue: [],
    culturePoints: 125,
    mainBuildingLevel: 5,
    hasSettlers: false
  };
  
  const report = optimizer.generateStrategyReport(sampleState);
  console.log('\n🎯 TRAVIAN V3 STRATEGY REPORT');
  console.log('=====================================');
  console.log(JSON.stringify(report, null, 2));
}

/**
 * TravianAssistant V3 - Calculation Engine
 * Core calculation module for all Travian game mechanics
 * Designed for local execution in Chrome extension (0ms latency)
 */

export class TravianCalculator {
  constructor(serverSpeed = 1, tribe = 'romans') {
    this.serverSpeed = serverSpeed;
    this.tribe = tribe;
    this.buildingData = null;
    this.troopData = null;
    this.mainBuildingMultipliers = [
      1.00, 1.00, 1.04, 1.08, 1.12, 1.16,
      1.20, 1.25, 1.29, 1.34, 1.39,
      1.44, 1.50, 1.55, 1.61, 1.67,
      1.73, 1.80, 1.87, 1.93, 2.01
    ];
  }

  /**
   * Initialize calculator with game data
   */
  async init() {
    // Load building data based on server speed
    const buildingFile = this.serverSpeed === 1 
      ? '/data/buildings/travian_buildings_SS1X.json'
      : '/data/buildings/travian_complete_buildings_data.json';
    
    const troopFile = this.serverSpeed === 1
      ? '/data/troops/travian_troops_SS1X.json'
      : '/data/troops/travian_all_tribes_complete.json';

    try {
      this.buildingData = await this.loadJSON(buildingFile);
      this.troopData = await this.loadJSON(troopFile);
      return true;
    } catch (error) {
      console.error('Failed to load game data:', error);
      return false;
    }
  }

  /**
   * Load JSON data from file
   */
  async loadJSON(path) {
    const response = await fetch(chrome.runtime.getURL(path));
    return response.json();
  }

  /**
   * Calculate actual build time for a building
   * @param {string} buildingName - Name of the building
   * @param {number} level - Target level
   * @param {object} modifiers - Build speed modifiers
   * @returns {number} Build time in seconds
   */
  calculateBuildTime(buildingName, level, modifiers = {}) {
    const {
      mainBuildingLevel = 0,
      goldClub = false,
      heroConstruction = 0,
      artifact = 0, // 0=none, 1=small(1.5x), 2=large(2x), 3=unique(3x)
      watchingAds = false
    } = modifiers;

    // Get base time from data
    const building = this.buildingData[buildingName];
    if (!building || !building[level - 1]) {
      throw new Error(`Invalid building or level: ${buildingName} level ${level}`);
    }

    const baseTime = building[level - 1].time;
    
    // Calculate multipliers
    let totalMultiplier = 1;
    
    // Main building speed boost
    totalMultiplier *= this.mainBuildingMultipliers[mainBuildingLevel];
    
    // Gold club (25% faster)
    if (goldClub) {
      totalMultiplier *= 1.25;
    }
    
    // Hero construction bonus (variable)
    if (heroConstruction > 0) {
      totalMultiplier *= (1 + heroConstruction / 100);
    }
    
    // Artifacts
    const artifactMultipliers = [1, 1.5, 2, 3];
    totalMultiplier *= artifactMultipliers[artifact];
    
    // Watching ads (25% reduction = 0.75x time)
    if (watchingAds) {
      totalMultiplier *= 1.333; // Inverse of 0.75
    }
    
    // Calculate actual time
    const actualTime = baseTime / totalMultiplier;
    
    return Math.round(actualTime);
  }

  /**
   * Get resource costs for a building level
   */
  getBuildingCost(buildingName, level) {
    const building = this.buildingData[buildingName];
    if (!building || !building[level - 1]) {
      return null;
    }
    
    const data = building[level - 1];
    return {
      wood: data.wood,
      clay: data.clay,
      iron: data.iron,
      crop: data.crop,
      pop: data.pop,
      cp: data.cp
    };
  }

  /**
   * Calculate resource production for a field
   */
  calculateProduction(fieldType, level, oasisBonus = 0) {
    // Base production values per level (simplified - needs full data)
    const baseProduction = {
      'Woodcutter': [5, 9, 15, 22, 33, 50, 70, 100, 140, 200, 280, 375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450],
      'Clay Pit': [5, 9, 15, 22, 33, 50, 70, 100, 140, 200, 280, 375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450],
      'Iron Mine': [5, 9, 15, 22, 33, 50, 70, 100, 140, 200, 280, 375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450],
      'Cropland': [5, 9, 15, 22, 33, 50, 70, 100, 140, 200, 280, 375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450]
    };

    if (!baseProduction[fieldType] || !baseProduction[fieldType][level - 1]) {
      return 0;
    }

    const base = baseProduction[fieldType][level - 1];
    const withOasis = base * (1 + oasisBonus / 100);
    
    return Math.round(withOasis * this.serverSpeed);
  }

  /**
   * Check if building requirements are met
   */
  canBuild(buildingName, currentBuildings) {
    const requirements = this.getBuildingRequirements(buildingName);
    
    for (const [reqBuilding, reqLevel] of Object.entries(requirements)) {
      const currentLevel = currentBuildings[reqBuilding] || 0;
      if (currentLevel < reqLevel) {
        return {
          canBuild: false,
          missing: `${reqBuilding} level ${reqLevel} (current: ${currentLevel})`
        };
      }
    }
    
    return { canBuild: true };
  }

  /**
   * Get building requirements (partial - needs completion)
   */
  getBuildingRequirements(buildingName) {
    const requirements = {
      'Barracks': { 'Main Building': 3, 'Rally Point': 1 },
      'Stable': { 'Barracks': 3, 'Academy': 5 },
      'Workshop': { 'Academy': 10, 'Main Building': 5 },
      'Academy': { 'Barracks': 3, 'Main Building': 3 },
      'Blacksmith': { 'Academy': 1, 'Main Building': 3 },
      'Armoury': { 'Academy': 1, 'Main Building': 3 },
      'Tournament Square': { 'Rally Point': 15 },
      'Treasury': { 'Main Building': 10 },
      'Trade Office': { 'Marketplace': 20, 'Stable': 10 },
      'Great Barracks': { 'Barracks': 20 },
      'Great Stable': { 'Stable': 20 },
      'Residence': { 'Main Building': 5 },
      'Palace': { 'Main Building': 5 },
      'Town Hall': { 'Main Building': 10, 'Academy': 10 },
      'Marketplace': { 'Main Building': 3, 'Warehouse': 1, 'Granary': 1 },
      'Embassy': { 'Main Building': 1 },
      'City Wall': { 'Main Building': 1 },
      'Earth Wall': { 'Main Building': 1 },
      'Palisade': { 'Main Building': 1 },
      'Sawmill': { 'Woodcutter': 10, 'Main Building': 5 },
      'Brickyard': { 'Clay Pit': 10, 'Main Building': 5 },
      'Iron Foundry': { 'Iron Mine': 10, 'Main Building': 5 },
      'Grain Mill': { 'Cropland': 5 },
      'Bakery': { 'Cropland': 10, 'Main Building': 5, 'Grain Mill': 5 }
    };
    
    return requirements[buildingName] || {};
  }

  /**
   * Calculate total resources needed for multiple upgrades
   */
  calculateUpgradePath(upgrades) {
    const totalCost = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0,
      time: 0,
      cp: 0
    };

    for (const upgrade of upgrades) {
      const cost = this.getBuildingCost(upgrade.building, upgrade.level);
      if (cost) {
        totalCost.wood += cost.wood;
        totalCost.clay += cost.clay;
        totalCost.iron += cost.iron;
        totalCost.crop += cost.crop;
        totalCost.cp += cost.cp;
        
        const time = this.calculateBuildTime(
          upgrade.building, 
          upgrade.level, 
          upgrade.modifiers || {}
        );
        totalCost.time += time;
      }
    }

    return totalCost;
  }

  /**
   * Calculate ROI for a building upgrade
   */
  calculateROI(buildingName, currentLevel, targetLevel) {
    const cost = this.getBuildingCost(buildingName, targetLevel);
    const totalResourceCost = cost.wood + cost.clay + cost.iron + cost.crop;
    
    // For production buildings
    if (['Woodcutter', 'Clay Pit', 'Iron Mine', 'Cropland'].includes(buildingName)) {
      const currentProduction = this.calculateProduction(buildingName, currentLevel);
      const newProduction = this.calculateProduction(buildingName, targetLevel);
      const productionIncrease = newProduction - currentProduction;
      
      // Hours to pay back investment
      const hoursToPayback = totalResourceCost / productionIncrease;
      
      return {
        cost: totalResourceCost,
        productionIncrease,
        hoursToPayback,
        daysToPayback: hoursToPayback / 24
      };
    }
    
    // For other buildings, calculate CP efficiency
    return {
      cost: totalResourceCost,
      cpGained: cost.cp,
      resourcesPerCP: totalResourceCost / cost.cp
    };
  }
}

/**
 * Game Start Optimizer - Specialized for first 7 days
 */
export class GameStartOptimizer {
  constructor(calculator, tribe = 'romans', goldAvailable = 0) {
    this.calculator = calculator;
    this.tribe = tribe;
    this.goldAvailable = goldAvailable;
    this.serverAge = 0; // hours since server start
  }

  /**
   * Get optimal build order for current game phase
   */
  getOptimalBuildOrder(currentState) {
    const phase = this.getCurrentPhase();
    
    switch(phase) {
      case 'INITIAL':
        return this.getInitialPhaseOrder(currentState);
      case 'ACCELERATION':
        return this.getAccelerationPhaseOrder(currentState);
      case 'CP_RUSH':
        return this.getCPRushPhaseOrder(currentState);
      case 'SETTLEMENT':
        return this.getSettlementPhaseOrder(currentState);
      default:
        return [];
    }
  }

  /**
   * Determine current game phase
   */
  getCurrentPhase() {
    if (this.serverAge < 24) return 'INITIAL';
    if (this.serverAge < 72) return 'ACCELERATION';
    if (this.serverAge < 144) return 'CP_RUSH';
    return 'SETTLEMENT';
  }

  /**
   * Initial phase (0-24 hours): Balance all resources
   */
  getInitialPhaseOrder(state) {
    const orders = [];
    
    // Get all resource fields to level 1
    ['Woodcutter', 'Clay Pit', 'Iron Mine', 'Cropland'].forEach(type => {
      const fields = state.fields.filter(f => f.type === type && f.level === 0);
      fields.forEach(field => {
        orders.push({
          building: type,
          level: 1,
          priority: 1,
          reason: 'Basic resource production'
        });
      });
    });

    // Main Building to 3 for faster construction
    if (state.buildings['Main Building'] < 3) {
      orders.push({
        building: 'Main Building',
        level: state.buildings['Main Building'] + 1,
        priority: 2,
        reason: 'Speed up construction'
      });
    }

    // Granary and Warehouse for storage
    if (!state.buildings['Granary']) {
      orders.push({
        building: 'Granary',
        level: 1,
        priority: 3,
        reason: 'Prevent crop overflow'
      });
    }

    return orders.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Acceleration phase (24-72 hours): Focus one resource type
   */
  getAccelerationPhaseOrder(state) {
    const orders = [];
    
    // Determine which resource to focus based on village type
    const focusResource = this.determineFocusResource(state);
    
    // Push focus resource fields to level 5
    const focusFields = state.fields.filter(f => f.type === focusResource && f.level < 5);
    focusFields.forEach(field => {
      orders.push({
        building: focusResource,
        level: field.level + 1,
        priority: 1,
        reason: `Focus on ${focusResource} production`
      });
    });

    // Main Building to 5
    if (state.buildings['Main Building'] < 5) {
      orders.push({
        building: 'Main Building',
        level: state.buildings['Main Building'] + 1,
        priority: 2,
        reason: 'Maximize construction speed'
      });
    }

    // Market for NPC trading
    if (!state.buildings['Marketplace']) {
      orders.push({
        building: 'Marketplace',
        level: 1,
        priority: 3,
        reason: 'Enable NPC trading'
      });
    }

    return orders.sort((a, b) => a.priority - b.priority);
  }

  /**
   * CP Rush phase (72-144 hours): Build CP buildings
   */
  getCPRushPhaseOrder(state) {
    const orders = [];
    
    // Priority CP buildings
    const cpBuildings = [
      { name: 'Embassy', maxLevel: 1, cpPerLevel: 5 },
      { name: 'Academy', maxLevel: 5, cpPerLevel: 8 },
      { name: 'Marketplace', maxLevel: 5, cpPerLevel: 4 },
      { name: 'Main Building', maxLevel: 10, cpPerLevel: 2 }
    ];

    cpBuildings.forEach(building => {
      const currentLevel = state.buildings[building.name] || 0;
      if (currentLevel < building.maxLevel) {
        const cost = this.calculator.getBuildingCost(building.name, currentLevel + 1);
        const efficiency = cost ? (cost.wood + cost.clay + cost.iron + cost.crop) / cost.cp : Infinity;
        
        orders.push({
          building: building.name,
          level: currentLevel + 1,
          priority: efficiency,
          reason: `CP generation (${cost?.cp} CP)`
        });
      }
    });

    // Residence for settlers
    if (!state.buildings['Residence']) {
      orders.push({
        building: 'Residence',
        level: 1,
        priority: 0, // Highest priority
        reason: 'Prepare for settlement'
      });
    }

    return orders.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Settlement phase (144-168 hours): Prepare settlers
   */
  getSettlementPhaseOrder(state) {
    const orders = [];
    
    // Residence to level 10
    const residenceLevel = state.buildings['Residence'] || 0;
    if (residenceLevel < 10) {
      orders.push({
        building: 'Residence',
        level: residenceLevel + 1,
        priority: 1,
        reason: 'Enable settler training'
      });
    }

    // Resource fields to support settler training
    ['Woodcutter', 'Clay Pit', 'Iron Mine'].forEach(type => {
      const avgLevel = this.getAverageFieldLevel(state, type);
      if (avgLevel < 7) {
        orders.push({
          building: type,
          level: avgLevel + 1,
          priority: 2,
          reason: 'Resources for settlers'
        });
      }
    });

    // Warehouse expansion for resources
    const warehouseLevel = state.buildings['Warehouse'] || 0;
    if (warehouseLevel < 10) {
      orders.push({
        building: 'Warehouse',
        level: warehouseLevel + 1,
        priority: 3,
        reason: 'Storage for settler resources'
      });
    }

    return orders.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Determine which resource to focus on
   */
  determineFocusResource(state) {
    // Count fields of each type
    const fieldCounts = {
      'Woodcutter': 0,
      'Clay Pit': 0,
      'Iron Mine': 0,
      'Cropland': 0
    };

    state.fields.forEach(field => {
      fieldCounts[field.type]++;
    });

    // Focus on the resource with most fields (excluding crop)
    delete fieldCounts['Cropland'];
    return Object.entries(fieldCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Get average level of fields of a type
   */
  getAverageFieldLevel(state, type) {
    const fields = state.fields.filter(f => f.type === type);
    if (fields.length === 0) return 0;
    
    const totalLevel = fields.reduce((sum, f) => sum + f.level, 0);
    return Math.floor(totalLevel / fields.length);
  }

  /**
   * Calculate time to second village
   */
  calculateTimeToSettlement(state) {
    // Calculate current CP generation
    let cpPerDay = 2; // Base CP
    
    for (const [building, level] of Object.entries(state.buildings)) {
      for (let l = 1; l <= level; l++) {
        const cost = this.calculator.getBuildingCost(building, l);
        if (cost) cpPerDay += cost.cp;
      }
    }

    // CP needed for settlement (typically 200 for 2nd village)
    const cpNeeded = 200 - state.currentCP;
    const daysToCP = cpNeeded / cpPerDay;

    // Time to train 3 settlers (after residence 10)
    const settlerTrainingTime = 24; // hours, simplified

    return {
      daysToCP,
      totalDays: daysToCP + (settlerTrainingTime / 24),
      cpPerDay,
      cpNeeded
    };
  }

  /**
   * Suggest gold usage
   */
  suggestGoldUsage(state, goldAmount) {
    const suggestions = [];

    const phase = this.getCurrentPhase();
    
    if (phase === 'INITIAL' || phase === 'ACCELERATION') {
      suggestions.push({
        action: 'NPC Trading',
        cost: 3,
        benefit: 'Balance resources for continuous building',
        priority: 1
      });
    }

    if (phase === 'CP_RUSH') {
      suggestions.push({
        action: 'Instant complete CP building',
        cost: 2,
        benefit: 'Save 2-4 hours per building',
        priority: 1
      });
    }

    if (phase === 'SETTLEMENT') {
      suggestions.push({
        action: 'Instant complete settlers',
        cost: 9, // 3 gold per settler
        benefit: 'Settle 8-12 hours earlier',
        priority: 1
      });
    }

    suggestions.push({
      action: 'Gold Club',
      cost: 100,
      benefit: '25% faster construction all week',
      priority: 2
    });

    return suggestions.sort((a, b) => a.priority - b.priority);
  }
}

// Export for Chrome extension use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TravianCalculator, GameStartOptimizer };
}

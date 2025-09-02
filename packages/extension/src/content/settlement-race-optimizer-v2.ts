/**
 * TravianAssistant v2.1 - Settlement Race Optimizer
 * Includes Hero management and Oasis clearing strategy
 * Focused on achieving fastest possible second village
 */

export class SettlementRaceOptimizer {
  private readonly CP_REQUIREMENTS = [0, 500, 1000, 1500];
  private readonly STORAGE_KEY_PREFIX = 'TLA_SRO_';
  
  // Oasis animal strengths (for calculating hero requirements)
  private readonly OASIS_ANIMALS = {
    rat: { attack: 10, defense: 25, health: 20 },      // Easy - hero level 0-1
    spider: { attack: 20, defense: 35, health: 40 },   // Easy - hero level 1-2
    snake: { attack: 60, defense: 40, health: 50 },    // Medium - hero level 3+
    bat: { attack: 80, defense: 66, health: 50 },      // Medium - hero level 3+
    boar: { attack: 50, defense: 70, health: 100 },    // Hard - hero level 5+
    wolf: { attack: 100, defense: 80, health: 70 },    // Hard - hero level 5+
    bear: { attack: 250, defense: 140, health: 200 },  // Very Hard - hero level 10+
    crocodile: { attack: 450, defense: 380, health: 240 }, // Very Hard - hero level 15+
    tiger: { attack: 200, defense: 170, health: 250 },  // Hard - hero level 10+
    elephant: { attack: 600, defense: 440, health: 520 } // Extreme - hero level 20+
  };

  constructor() {
    this.initializeDataStore();
    this.captureCurrentState();
    this.analyzeSettlementPath();
  }

  private initializeDataStore() {
    const existingData = this.loadGameData();
    if (!existingData) {
      this.gameData = {
        serverStartTime: this.detectServerStart(),
        villageSnapshots: [],
        buildHistory: [],
        cpEvents: [],
        resourceHistory: [],
        heroData: {
          level: 0,
          experience: 0,
          health: 100,
          strengthPoints: 0,
          adventures: []
        },
        oasisCleared: []
      };
      this.saveGameData();
    } else {
      this.gameData = existingData;
    }
  }

  private captureCurrentState() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Capture game state including hero data
        const data = {
          resources: window.resources,
          village: {
            id: document.querySelector('.villageList .active')?.dataset?.did,
            name: document.querySelector('.villageList .active .name')?.textContent
          },
          hero: {
            level: parseInt(document.querySelector('.heroLevel')?.textContent || '0'),
            health: parseInt(document.querySelector('.heroHealth')?.textContent || '100'),
            experience: parseInt(document.querySelector('.heroExperience')?.textContent || '0'),
            adventures: document.querySelectorAll('.adventure').length
          },
          serverTime: document.querySelector('#servertime')?.textContent,
          timestamp: Date.now()
        };
        
        window.postMessage({
          type: 'TLA_GAME_STATE',
          data: data
        }, '*');
      })();
    `;
    document.head.appendChild(script);
    script.remove();
  }

  private analyzeSettlementPath() {
    const hoursSinceStart = this.getHoursSinceStart();
    const currentCP = this.getCurrentCP();
    const cpPerDay = this.calculateCPGeneration();
    const daysToTarget = (this.CP_REQUIREMENTS[1] - currentCP) / cpPerDay;
    const heroLevel = this.getHeroLevel();
    
    return {
      phase: this.getCurrentPhase(hoursSinceStart),
      currentCP,
      cpPerDay,
      estimatedSettlementDay: Math.ceil(daysToTarget),
      heroLevel,
      nextCriticalAction: this.getNextCriticalAction(hoursSinceStart, heroLevel),
      oasisRecommendation: this.getOasisRecommendation(heroLevel)
    };
  }

  private getCurrentPhase(hours: number): string {
    if (hours < 24) return 'FOUNDATION';
    if (hours < 72) return 'CP_RUSH';
    if (hours < 120) return 'RESIDENCE_PREP';
    if (hours < 168) return 'SETTLER_TRAINING';
    return 'SETTLEMENT_READY';
  }

  private getNextCriticalAction(hours: number, heroLevel: number): string {
    const phase = this.getCurrentPhase(hours);
    
    // Hero-specific actions based on level
    if (heroLevel === 0 && hours > 6) {
      return '🦸 URGENT: Complete first adventure for hero!';
    }
    
    if (heroLevel < 3 && hours > 24) {
      return '🦸 Send hero on adventures - need resources!';
    }

    const actions = {
      'FOUNDATION': [
        'Complete tutorial quests for resources',
        'All resource fields to level 1, then level 2',
        'Build Cranny level 1 (protection + CP)',
        'Send hero on EVERY adventure',
        'Clear nearest oasis with 1-2 animals'
      ],
      'CP_RUSH': [
        'Embassy level 1 = 24 CP/day (Priority!)',
        'Marketplace level 1 = 20 CP/day',
        'Main Building to level 5 (speed bonus)',
        'Cranny to level 5 (cheap CP)',
        'Clear 2-3 animal oases for resources'
      ],
      'RESIDENCE_PREP': [
        'RESIDENCE TO LEVEL 10 - Top Priority!',
        'Hero should be level 5+ for oasis clearing',
        'Academy level 1 (required for settlers)',
        'Balance resources via NPC trader',
        'Stockpile 15k/12k/15k/9k for settlers'
      ],
      'SETTLER_TRAINING': [
        'Train 3 settlers NOW',
        'Scout for 15-cropper or 9-cropper',
        'Clear high-level oases for bonus resources',
        'Prepare 750 resources for founding'
      ]
    };
    
    return actions[phase]?.[0] || 'Maintain production';
  }

  private getOasisRecommendation(heroLevel: number): string {
    // Recommend appropriate oases based on hero level
    if (heroLevel === 0) {
      return '⚠️ Get hero first! Complete adventure.';
    } else if (heroLevel <= 2) {
      return '🐀 Clear oases with 1-2 rats/spiders (40-80 resources each)';
    } else if (heroLevel <= 5) {
      return '🐍 Clear oases with snakes/bats (160-200 resources)';
    } else if (heroLevel <= 10) {
      return '🐺 Clear oases with boars/wolves (200-400 resources)';
    } else {
      return '🐻 Clear bear/tiger oases (400-800+ resources)';
    }
  }

  private getHeroLevel(): number {
    // Get from stored data or scrape from page
    return this.gameData.heroData?.level || 0;
  }

  private calculateOasisResources(animals: string[], heroLevel: number): number {
    // Each animal level killed = 40 of each resource
    // Example: killing 3 rats (level 1 each) = 120 of each resource
    let totalLevels = 0;
    
    animals.forEach(animal => {
      // Simplified - in reality need combat simulator
      if (this.canDefeatAnimal(animal, heroLevel)) {
        totalLevels += this.getAnimalLevel(animal);
      }
    });
    
    return totalLevels * 40; // 40 resources per level
  }

  private canDefeatAnimal(animal: string, heroLevel: number): boolean {
    // Simplified combat check
    const heroStrength = heroLevel * 20; // Rough estimate
    const animalStats = this.OASIS_ANIMALS[animal];
    return heroStrength > (animalStats?.attack || 0);
  }

  private getAnimalLevel(animal: string): number {
    // Simplified - rats/spiders = 1, snakes/bats = 2, etc.
    const levels = {
      rat: 1, spider: 1, snake: 2, bat: 2,
      boar: 3, wolf: 3, bear: 5, tiger: 5,
      crocodile: 6, elephant: 8
    };
    return levels[animal] || 1;
  }

  public getRecommendations(): string[] {
    const analysis = this.analyzeSettlementPath();
    const recommendations = [];
    const hoursSinceStart = this.getHoursSinceStart();
    
    // Phase-specific recommendations
    if (analysis.phase === 'FOUNDATION') {
      recommendations.push('🎯 Phase: FOUNDATION (First 24 hours)');
      recommendations.push('📦 Build: All fields to lvl 2, Cranny 1');
      if (analysis.heroLevel === 0) {
        recommendations.push('🦸 URGENT: Get hero from adventure!');
      } else {
        recommendations.push(`🦸 Hero Level ${analysis.heroLevel}: ${analysis.oasisRecommendation}`);
      }
      recommendations.push('💡 Save gold for Day 2 NPC');
    } else if (analysis.phase === 'CP_RUSH') {
      recommendations.push('🏗️ Phase: CP RUSH (24-72 hours)');
      recommendations.push(`📊 CP: ${analysis.currentCP}/500 (${Math.round(analysis.currentCP/5)}%)`);
      recommendations.push(`📅 Settlement ETA: ${analysis.estimatedSettlementDay} days`);
      recommendations.push(`🦸 ${analysis.oasisRecommendation}`);
      
      // Specific building priorities
      if (!this.hasBuilding('embassy')) {
        recommendations.push('🚨 BUILD EMBASSY NOW! (24 CP/day)');
      }
      if (!this.hasBuilding('marketplace')) {
        recommendations.push('📦 Build Marketplace (20 CP/day)');
      }
    } else if (analysis.phase === 'RESIDENCE_PREP') {
      recommendations.push('🏠 Phase: RESIDENCE PREPARATION');
      recommendations.push('🎯 Residence → Level 10 (TOP PRIORITY)');
      recommendations.push('🎓 Academy → Level 1 (for settlers)');
      recommendations.push(`🦸 ${analysis.oasisRecommendation}`);
      recommendations.push('💰 Need: 15k wood, 12k clay, 15k iron, 9k crop');
    } else if (analysis.phase === 'SETTLER_TRAINING') {
      recommendations.push('🚀 Phase: SETTLER TRAINING');
      recommendations.push('👥 Train 3 settlers (5k/4k/5k/3k each)');
      recommendations.push('🗺️ Scout for 15-cropper location');
      recommendations.push(`🦸 ${analysis.oasisRecommendation}`);
    }
    
    // Always show next action
    recommendations.push(`⏭️ Next: ${analysis.nextCriticalAction}`);
    
    // Time-based alerts
    if (hoursSinceStart > 24 && analysis.currentCP < 50) {
      recommendations.unshift('⚠️ BEHIND SCHEDULE - Build CP now!');
    }
    
    if (hoursSinceStart > 96 && analysis.currentCP < 300) {
      recommendations.unshift('🚨 CRITICAL - May miss day 7 settlement!');
    }
    
    return recommendations;
  }

  private hasBuilding(type: string): boolean {
    // Check if building exists in current village
    // This would check localStorage or current page
    return false; // Placeholder
  }

  private getCurrentCP(): number {
    const cpElement = document.querySelector('[class*="culture"] .value');
    if (cpElement) {
      return parseInt(cpElement.textContent || '0');
    }
    return this.calculateCPFromBuildings();
  }

  private calculateCPFromBuildings(): number {
    let totalCP = 0;
    
    document.querySelectorAll('.buildingSlot').forEach(slot => {
      const level = parseInt(slot.querySelector('.level')?.textContent || '0');
      const buildingType = slot.className.match(/g(\d+)/)?.[1];
      
      const cpValues = {
        '15': 5,  // Main Building
        '18': 24, // Embassy  
        '17': 20, // Marketplace
        '23': 2,  // Cranny
        '10': 1,  // Warehouse
        '11': 1   // Granary
      };
      
      if (buildingType && cpValues[buildingType]) {
        totalCP += cpValues[buildingType] * level;
      }
    });
    
    return totalCP;
  }

  private getHoursSinceStart(): number {
    const now = Date.now();
    const start = this.gameData.serverStartTime;
    return (now - start) / (1000 * 60 * 60);
  }

  private detectServerStart(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + 'serverStart');
    if (stored) return parseInt(stored);
    
    // For new server, set to current time
    const now = Date.now();
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'serverStart', now.toString());
    return now;
  }

  private loadGameData(): any {
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + 'gameData');
    return stored ? JSON.parse(stored) : null;
  }

  private saveGameData() {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'gameData', JSON.stringify(this.gameData));
  }

  public displayHUD() {
    const existing = document.getElementById('tla-settlement-hud');
    if (existing) existing.remove();
    
    const hud = document.createElement('div');
    hud.id = 'tla-settlement-hud';
    hud.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      min-width: 280px;
      max-width: 350px;
    `;
    
    const recommendations = this.getRecommendations();
    const hoursSinceStart = Math.floor(this.getHoursSinceStart());
    
    hud.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🏁 Settlement Race - Hour ${hoursSinceStart}</h3>
      ${recommendations.map(r => `<div style="margin: 5px 0;">${r}</div>`).join('')}
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">
        <button id="tla-refresh" style="width: 48%; margin-right: 2%;">Refresh</button>
        <button id="tla-reset-server" style="width: 48%; margin-left: 2%;">New Server</button>
      </div>
    `;
    
    document.body.appendChild(hud);
    
    document.getElementById('tla-refresh')?.addEventListener('click', () => {
      this.captureCurrentState();
      this.displayHUD();
    });
    
    document.getElementById('tla-reset-server')?.addEventListener('click', () => {
      if (confirm('Reset for new server? This will clear all stored data.')) {
        localStorage.removeItem(this.STORAGE_KEY_PREFIX + 'serverStart');
        localStorage.removeItem(this.STORAGE_KEY_PREFIX + 'gameData');
        location.reload();
      }
    });
  }
}

// Auto-initialize
const optimizer = new SettlementRaceOptimizer();
optimizer.displayHUD();

// Update every 30 seconds
setInterval(() => {
  optimizer.captureCurrentState();
  optimizer.displayHUD();
}, 30000);

window.addEventListener('message', (event) => {
  if (event.data?.type === 'TLA_GAME_STATE') {
    console.log('[TLA SRO] Game state captured:', event.data.data);
    const snapshot = event.data.data;
    const key = `TLA_SRO_snapshot_${snapshot.timestamp}`;
    localStorage.setItem(key, JSON.stringify(snapshot));
  }
});

export default SettlementRaceOptimizer;
/**
 * TravianAssistant v2.0 - Settlement Race Optimizer
 * Focused on achieving fastest possible second village
 * Uses RBP-style persistent data storage
 */

export class SettlementRaceOptimizer {
  private readonly CP_REQUIREMENTS = [0, 500, 1000, 1500]; // CP needed for villages 2,3,4
  private readonly STORAGE_KEY_PREFIX = 'TLA_SRO_';
  
  constructor() {
    this.initializeDataStore();
    this.captureCurrentState();
    this.analyzeSettlementPath();
  }

  private initializeDataStore() {
    // Get or create persistent game state
    const existingData = this.loadGameData();
    if (!existingData) {
      this.gameData = {
        serverStartTime: this.detectServerStart(),
        villageSnapshots: [],
        buildHistory: [],
        cpEvents: [],
        resourceHistory: []
      };
      this.saveGameData();
    } else {
      this.gameData = existingData;
    }
  }

  private captureCurrentState() {
    // Inject script to capture window.resources
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const data = {
          resources: window.resources,
          village: {
            id: document.querySelector('.villageList .active')?.dataset?.did,
            name: document.querySelector('.villageList .active .name')?.textContent
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
    
    return {
      phase: this.getCurrentPhase(hoursSinceStart),
      currentCP,
      cpPerDay,
      estimatedSettlementDay: Math.ceil(daysToTarget),
      nextCriticalAction: this.getNextCriticalAction(hoursSinceStart)
    };
  }

  private getCurrentPhase(hours: number): string {
    if (hours < 24) return 'FOUNDATION';        // Build resource base
    if (hours < 72) return 'CP_RUSH';          // Focus on CP buildings
    if (hours < 120) return 'RESIDENCE_PREP';  // Residence to 10
    if (hours < 168) return 'SETTLER_TRAINING'; // Train 3 settlers
    return 'SETTLEMENT_READY';
  }

  private getNextCriticalAction(hours: number): string {
    const phase = this.getCurrentPhase(hours);
    
    const actions = {
      'FOUNDATION': [
        'Upgrade all resource fields to level 2',
        'Build Warehouse level 1',
        'Build Granary level 1',
        'Complete all adventure quests'
      ],
      'CP_RUSH': [
        'Build Embassy level 1 (24 CP/day)',
        'Build Marketplace level 1 (20 CP/day)', 
        'Build Cranny level 1-5 (cheap CP)',
        'Upgrade Main Building for speed bonus'
      ],
      'RESIDENCE_PREP': [
        'Residence to level 10 PRIORITY',
        'Balance resources via NPC/Market',
        'Stockpile resources for settlers'
      ],
      'SETTLER_TRAINING': [
        'Train 3 settlers (5000/4000/5000/3000 each)',
        'Scout for 15-cropper location',
        'Prepare settling party escort'
      ]
    };
    
    return actions[phase]?.[0] || 'Maintain resource production';
  }

  private getCurrentCP(): number {
    // Scrape from page or calculate from buildings
    const cpElement = document.querySelector('[class*="culture"] .value');
    if (cpElement) {
      return parseInt(cpElement.textContent || '0');
    }
    
    // Fallback: calculate from known buildings
    return this.calculateCPFromBuildings();
  }

  private calculateCPFromBuildings(): number {
    // Each building level gives CP
    // Main Building: 5 CP per level
    // Embassy: 24 CP at level 1
    // Marketplace: 20 CP at level 1
    // Cranny: 2 CP per level
    // Warehouse/Granary: 1 CP per level
    
    let totalCP = 0;
    
    // Parse buildings from page
    document.querySelectorAll('.buildingSlot').forEach(slot => {
      const level = parseInt(slot.querySelector('.level')?.textContent || '0');
      const buildingType = slot.className.match(/g(\d+)/)?.[1];
      
      // Map building IDs to CP values
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

  private calculateCPGeneration(): number {
    // Sum all CP-generating buildings
    return this.calculateCPFromBuildings(); // This is actually total, need to store/diff for rate
  }

  private getHoursSinceStart(): number {
    const now = Date.now();
    const start = this.gameData.serverStartTime;
    return (now - start) / (1000 * 60 * 60);
  }

  private detectServerStart(): number {
    // Try to detect from page or use stored value
    // Servers typically start at specific times
    // This is a fallback - ideally user sets this once
    
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + 'serverStart');
    if (stored) return parseInt(stored);
    
    // Default: assume server started 48 hours ago (typical when players join)
    const defaultStart = Date.now() - (48 * 60 * 60 * 1000);
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'serverStart', defaultStart.toString());
    return defaultStart;
  }

  private loadGameData(): any {
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + 'gameData');
    return stored ? JSON.parse(stored) : null;
  }

  private saveGameData() {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'gameData', JSON.stringify(this.gameData));
  }

  // Public API for UI
  public getRecommendations(): string[] {
    const analysis = this.analyzeSettlementPath();
    const recommendations = [];
    
    if (analysis.phase === 'FOUNDATION') {
      recommendations.push('🎯 Focus: Build resource fields to level 2');
      recommendations.push('💡 Tip: Save gold for day 2 NPC trader');
    } else if (analysis.phase === 'CP_RUSH') {
      recommendations.push('🏗️ Build CP buildings NOW');
      recommendations.push(`📊 Current: ${analysis.currentCP} CP, Need: 500 CP`);
      recommendations.push(`📅 Settlement in ~${analysis.estimatedSettlementDay} days`);
    } else if (analysis.phase === 'RESIDENCE_PREP') {
      recommendations.push('🏠 URGENT: Residence to level 10');
      recommendations.push('💰 Stockpile: 5000/4000/5000/3000 per settler');
    }
    
    recommendations.push(`⏱️ Next: ${analysis.nextCriticalAction}`);
    
    return recommendations;
  }

  public displayHUD() {
    // Remove existing HUD
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
      min-width: 250px;
    `;
    
    const recommendations = this.getRecommendations();
    hud.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🏁 Settlement Race</h3>
      ${recommendations.map(r => `<div style="margin: 5px 0;">${r}</div>`).join('')}
      <button id="tla-refresh" style="margin-top: 10px; width: 100%;">Refresh</button>
    `;
    
    document.body.appendChild(hud);
    
    // Add refresh handler
    document.getElementById('tla-refresh')?.addEventListener('click', () => {
      this.captureCurrentState();
      this.displayHUD();
    });
  }
}

// Auto-initialize when content script loads
const optimizer = new SettlementRaceOptimizer();
optimizer.displayHUD();

// Update every 30 seconds
setInterval(() => {
  optimizer.captureCurrentState();
  optimizer.displayHUD();
}, 30000);

// Listen for game state messages
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TLA_GAME_STATE') {
    console.log('[TLA SRO] Game state captured:', event.data.data);
    // Store snapshot
    const snapshot = event.data.data;
    const key = `TLA_SRO_snapshot_${snapshot.timestamp}`;
    localStorage.setItem(key, JSON.stringify(snapshot));
  }
});

export default SettlementRaceOptimizer;
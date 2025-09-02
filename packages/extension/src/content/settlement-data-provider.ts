/**
 * Settlement Race Data Provider
 * Provides raw game data and algorithms for AI reasoning
 * No prescriptive strategy - AI makes the decisions
 */

export class SettlementDataProvider {
  private readonly STORAGE_KEY_PREFIX = 'TLA_SDP_';
  
  // Game constants for AI reference
  public readonly GAME_CONSTANTS = {
    CP_FOR_SECOND_VILLAGE: 500,
    SETTLER_COST: { wood: 5000, clay: 4000, iron: 5000, crop: 3000 },
    OASIS_RESOURCE_PER_LEVEL: 40,
    
    // Building CP values (per level)
    BUILDING_CP: {
      main: 5,
      embassy: 24,
      marketplace: 20,
      cranny: 2,
      warehouse: 1,
      granary: 1,
      barracks: 4,
      stable: 5,
      workshop: 6,
      academy: 6,
      smithy: 5,
      townhall: 8,
      residence: 2,
      palace: 5,
      treasury: 7,
      tradeOffice: 3
    },
    
    // Animal combat stats for AI calculation
    ANIMALS: {
      rat: { attack: 10, defense: 25, count: [1,2,3] },
      spider: { attack: 20, defense: 35, count: [1,2,3] },
      snake: { attack: 60, defense: 40, count: [1,2,3] },
      bat: { attack: 80, defense: 66, count: [1,2,3] },
      boar: { attack: 50, defense: 70, count: [1,2,3] },
      wolf: { attack: 100, defense: 80, count: [1,2,3] },
      bear: { attack: 250, defense: 140, count: [1,2] },
      crocodile: { attack: 450, defense: 380, count: [1,2] },
      tiger: { attack: 200, defense: 170, count: [1,2] },
      elephant: { attack: 600, defense: 440, count: [1,2] }
    }
  };

  constructor() {
    this.initializeDataStore();
    this.startDataCollection();
  }

  private initializeDataStore() {
    const existing = this.loadData('gameData');
    if (!existing) {
      const gameData = {
        serverStartTime: null, // Will be set by user or detected
        snapshots: [],
        events: []
      };
      this.saveData('gameData', gameData);
    }
  }

  private startDataCollection() {
    // Collect data every page load
    this.collectSnapshot();
    
    // Set up periodic collection
    setInterval(() => this.collectSnapshot(), 60000); // Every minute
  }

  private collectSnapshot() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Collect ALL raw data, let AI interpret it
        const snapshot = {
          timestamp: Date.now(),
          serverTime: document.querySelector('#servertime')?.textContent,
          
          // Resources
          resources: window.resources || null,
          
          // Buildings (let AI calculate CP from this)
          buildings: Array.from(document.querySelectorAll('.buildingSlot')).map(slot => ({
            position: slot.id,
            type: slot.className.match(/g(\\d+)/)?.[1],
            level: parseInt(slot.querySelector('.level')?.textContent || '0'),
            name: slot.querySelector('.name')?.textContent,
            underConstruction: slot.classList.contains('underConstruction')
          })),
          
          // Construction queue
          buildQueue: Array.from(document.querySelectorAll('.buildingList li')).map(item => ({
            name: item.querySelector('.name')?.textContent,
            duration: item.querySelector('.duration')?.textContent,
            completion: item.querySelector('.timer')?.textContent
          })),
          
          // Hero data
          hero: {
            exists: !!document.querySelector('.heroStatus'),
            level: parseInt(document.querySelector('.heroLevel')?.textContent || '0'),
            health: parseInt(document.querySelector('.heroHealth')?.textContent || '0'),
            experience: parseInt(document.querySelector('.heroExperience')?.textContent || '0'),
            strength: parseInt(document.querySelector('[class*="strength"] .value')?.textContent || '0'),
            offense: parseInt(document.querySelector('[class*="offense"] .value')?.textContent || '0'),
            defense: parseInt(document.querySelector('[class*="defense"] .value')?.textContent || '0')
          },
          
          // Adventures
          adventures: Array.from(document.querySelectorAll('.adventure')).map(adv => ({
            difficulty: adv.classList.contains('difficult') ? 'hard' : 'normal',
            duration: adv.querySelector('.duration')?.textContent,
            location: adv.querySelector('.coordinates')?.textContent
          })),
          
          // Village data
          village: {
            name: document.querySelector('.villageList .active .name')?.textContent,
            id: document.querySelector('.villageList .active')?.dataset?.did,
            coordinates: document.querySelector('.villageList .active .coordinates')?.textContent,
            population: parseInt(document.querySelector('[class*="population"] .value')?.textContent || '0'),
            culture: parseInt(document.querySelector('[class*="culture"] .value')?.textContent || '0'),
            cultureProduction: parseInt(document.querySelector('[class*="culture"] .production')?.textContent || '0')
          },
          
          // Troops (if visible)
          troops: Array.from(document.querySelectorAll('.troop')).map(troop => ({
            type: troop.className.match(/u(\\d+)/)?.[1],
            count: parseInt(troop.querySelector('.value')?.textContent || '0')
          })),
          
          // Fields
          fields: Array.from(document.querySelectorAll('[class*="resourceField"]')).map(field => ({
            type: field.className.match(/resourceField(\\d+)/)?.[1],
            level: parseInt(field.querySelector('.level')?.textContent || '0')
          })),
          
          // Movement/attacks (if visible)
          movements: Array.from(document.querySelectorAll('.movement')).map(mov => ({
            type: mov.classList.contains('attack') ? 'attack' : 
                  mov.classList.contains('return') ? 'return' : 'reinforcement',
            arrival: mov.querySelector('.timer')?.textContent
          }))
        };
        
        window.postMessage({
          type: 'TLA_GAME_SNAPSHOT',
          data: snapshot
        }, '*');
      })();
    `;
    document.head.appendChild(script);
    script.remove();
  }

  // Public API for AI to query
  
  public getCurrentSnapshot(): any {
    const snapshots = this.loadData('snapshots') || [];
    return snapshots[snapshots.length - 1] || null;
  }

  public getHistoricalSnapshots(hours: number = 24): any[] {
    const snapshots = this.loadData('snapshots') || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return snapshots.filter(s => s.timestamp > cutoff);
  }

  public getServerAge(): number {
    const startTime = this.loadData('serverStartTime');
    if (!startTime) return 0;
    return (Date.now() - startTime) / (1000 * 60 * 60); // Hours
  }

  public setServerStart(timestamp: number) {
    this.saveData('serverStartTime', timestamp);
  }

  // Algorithms for AI to use
  
  public calculateCPFromBuildings(buildings: any[]): number {
    let total = 0;
    buildings.forEach(building => {
      const cpPerLevel = this.GAME_CONSTANTS.BUILDING_CP[building.name?.toLowerCase()] || 0;
      total += cpPerLevel * building.level;
    });
    return total;
  }

  public calculateOasisResources(animalsKilled: {type: string, count: number}[]): any {
    const resources = { wood: 0, clay: 0, iron: 0, crop: 0 };
    animalsKilled.forEach(animal => {
      const resourcesPerAnimal = this.GAME_CONSTANTS.OASIS_RESOURCE_PER_LEVEL * animal.count;
      resources.wood += resourcesPerAnimal;
      resources.clay += resourcesPerAnimal;
      resources.iron += resourcesPerAnimal;
      resources.crop += resourcesPerAnimal;
    });
    return resources;
  }

  public calculateHeroCombatStrength(hero: any): number {
    // Simple formula - AI can use or modify
    return (hero.level * 100) + hero.strength + hero.offense;
  }

  public calculateAnimalDefense(animalType: string, count: number): number {
    const animal = this.GAME_CONSTANTS.ANIMALS[animalType];
    if (!animal) return 0;
    return (animal.attack + animal.defense) * count;
  }

  // Storage helpers
  
  private loadData(key: string): any {
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + key);
    return stored ? JSON.parse(stored) : null;
  }

  private saveData(key: string, data: any) {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  }

  // Event tracking for AI pattern learning
  
  public recordEvent(eventType: string, data: any) {
    const events = this.loadData('events') || [];
    events.push({
      type: eventType,
      timestamp: Date.now(),
      data: data
    });
    this.saveData('events', events);
  }

  // Get all data for AI in one call
  
  public getCompleteGameState(): any {
    return {
      current: this.getCurrentSnapshot(),
      history: this.getHistoricalSnapshots(24),
      serverAge: this.getServerAge(),
      constants: this.GAME_CONSTANTS,
      events: this.loadData('events') || []
    };
  }
}

// Listen for snapshots
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TLA_GAME_SNAPSHOT') {
    const snapshots = JSON.parse(localStorage.getItem('TLA_SDP_snapshots') || '[]');
    snapshots.push(event.data.data);
    
    // Keep only last 100 snapshots
    if (snapshots.length > 100) {
      snapshots.shift();
    }
    
    localStorage.setItem('TLA_SDP_snapshots', JSON.stringify(snapshots));
    console.log('[TLA Data Provider] Snapshot stored');
  }
});

export default SettlementDataProvider;
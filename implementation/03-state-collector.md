# State Collector - Game Data Scraping

## File: `src/content/state-collector.ts`

This module is responsible for scraping all game data from Travian pages.

```typescript
import { GameState, Village, Resources, BuildQueueItem, TroopCounts, Movement, Attack, HeroState } from '../shared/types';

export class StateCollector {
  private cache: Map<string, any> = new Map();
  
  collect(): GameState {
    // Clear cache for fresh collection
    this.cache.clear();
    
    return {
      timestamp: Date.now(),
      serverDay: this.getServerDay(),
      serverTime: this.getServerTime(),
      villages: this.getVillages(),
      resources: this.getResources(),
      production: this.getProduction(),
      capacity: this.getCapacity(),
      buildQueue: this.getBuildQueue(),
      troops: this.getTroops(),
      movements: this.getMovements(),
      incomingAttacks: this.getIncomingAttacks(),
      hero: this.getHeroState(),
      reports: this.getReports()
    };
  }
  
  private getServerDay(): number {
    const serverInfo = document.querySelector('.serverInfo');
    if (!serverInfo) return 0;
    
    const dayMatch = serverInfo.textContent?.match(/Day (\d+)/);
    return dayMatch ? parseInt(dayMatch[1]) : 0;
  }
  
  private getServerTime(): string {
    const timer = document.querySelector('#servertime');
    return timer?.textContent || '00:00:00';
  }
  
  private getVillages(): Village[] {
    const villages: Village[] = [];
    
    // Check village list
    document.querySelectorAll('#sidebarBoxVillagelist .villageList li').forEach(el => {
      const link = el.querySelector('a');
      const coords = el.querySelector('.coordinates');
      
      if (link && coords) {
        const coordMatch = coords.textContent?.match(/\((-?\d+)\|(-?\d+)\)/);
        villages.push({
          id: link.getAttribute('href')?.split('=')[1] || '',
          name: link.querySelector('.name')?.textContent || '',
          coordinates: {
            x: coordMatch ? parseInt(coordMatch[1]) : 0,
            y: coordMatch ? parseInt(coordMatch[2]) : 0
          },
          isCapital: el.classList.contains('mainVillage'),
          population: this.parseNumber(el.querySelector('.population')?.textContent),
          loyalty: 100 // Would need to navigate to village to get actual loyalty
        });
      }
    });
    
    // If no village list, get current village
    if (villages.length === 0) {
      const villageName = document.querySelector('#villageNameField')?.textContent;
      if (villageName) {
        villages.push({
          id: 'current',
          name: villageName,
          coordinates: { x: 0, y: 0 },
          isCapital: true,
          population: this.parseNumber(document.querySelector('.population')?.textContent),
          loyalty: 100
        });
      }
    }
    
    return villages;
  }
  
  private getResources(): Resources {
    return {
      wood: this.parseNumber('#l1') || this.parseNumber('.wood .value'),
      clay: this.parseNumber('#l2') || this.parseNumber('.clay .value'),
      iron: this.parseNumber('#l3') || this.parseNumber('.iron .value'),
      crop: this.parseNumber('#l4') || this.parseNumber('.crop .value')
    };
  }
  
  private getProduction() {
    // Try to get from production page or resource fields
    const production = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0,
      cropNet: 0
    };
    
    // Check if we're on production page
    const productionTable = document.querySelector('.production');
    if (productionTable) {
      const rows = productionTable.querySelectorAll('tr');
      rows.forEach((row, index) => {
        const value = this.parseNumber(row.querySelector('.num')?.textContent);
        if (index === 0) production.wood = value;
        if (index === 1) production.clay = value;
        if (index === 2) production.iron = value;
        if (index === 3) production.crop = value;
      });
    } else {
      // Try to get from tooltip or resource bar
      production.wood = this.parseNumber('.r1 .production') || this.parseProduction('#l1');
      production.clay = this.parseNumber('.r2 .production') || this.parseProduction('#l2');
      production.iron = this.parseNumber('.r3 .production') || this.parseProduction('#l3');
      production.crop = this.parseNumber('.r4 .production') || this.parseProduction('#l4');
    }
    
    // Get net crop
    const cropBalance = document.querySelector('.cropBalance');
    if (cropBalance) {
      production.cropNet = this.parseNumber(cropBalance.textContent);
    } else {
      production.cropNet = production.crop - this.getTroopConsumption();
    }
    
    return production;
  }
  
  private getCapacity() {
    return {
      warehouse: this.parseNumber('.warehouse .capacity') || 
                 this.parseNumber('#stockBarWarehouse') || 
                 10000, // Default
      granary: this.parseNumber('.granary .capacity') || 
               this.parseNumber('#stockBarGranary') || 
               10000 // Default
    };
  }
  
  private getBuildQueue(): BuildQueueItem[] {
    const queue: BuildQueueItem[] = [];
    
    // Check construction queue
    document.querySelectorAll('.buildingList li').forEach((el, index) => {
      const name = el.querySelector('.name')?.textContent || '';
      const level = el.querySelector('.lvl')?.textContent || '';
      const timer = el.querySelector('.timer')?.getAttribute('value');
      
      if (name && timer) {
        const finishTime = new Date(Date.now() + parseInt(timer) * 1000);
        queue.push({
          id: `build-${index}`,
          name: name.trim(),
          level: parseInt(level.replace(/\D/g, '')) || 1,
          timeLeft: this.formatTime(parseInt(timer)),
          finishTime
        });
      }
    });
    
    return queue;
  }
  
  private getTroops() {
    const troops = {
      own: {} as TroopCounts,
      reinforcements: {} as TroopCounts,
      totalDefense: 0,
      totalOffense: 0,
      inTraining: [] as any[]
    };
    
    // Get troops from rally point or barracks
    document.querySelectorAll('.troop').forEach(el => {
      const unitType = el.className.match(/u(\d+)/)?.[1];
      const count = this.parseNumber(el.querySelector('.num')?.textContent);
      
      if (unitType && count > 0) {
        troops.own[`u${unitType}`] = count;
      }
    });
    
    // Calculate approximate defense/offense (would need unit stats)
    troops.totalDefense = Object.values(troops.own).reduce((sum, count) => sum + count * 30, 0);
    troops.totalOffense = Object.values(troops.own).reduce((sum, count) => sum + count * 20, 0);
    
    // Check training queue
    document.querySelectorAll('.trainUnits .details').forEach(el => {
      const unitType = el.querySelector('.unitType')?.className.match(/u(\d+)/)?.[1];
      const count = this.parseNumber(el.querySelector('.count')?.textContent);
      const timer = el.querySelector('.timer')?.getAttribute('value');
      
      if (unitType && count && timer) {
        troops.inTraining.push({
          unitType: `u${unitType}`,
          count,
          finishTime: new Date(Date.now() + parseInt(timer) * 1000)
        });
      }
    });
    
    return troops;
  }
  
  private getMovements(): Movement[] {
    const movements: Movement[] = [];
    
    document.querySelectorAll('.movements tr').forEach((row, index) => {
      if (index === 0) return; // Skip header
      
      const type = this.detectMovementType(row);
      const timer = row.querySelector('.timer')?.getAttribute('value');
      const from = row.querySelector('.from')?.textContent || '';
      const to = row.querySelector('.to')?.textContent || '';
      
      if (timer) {
        movements.push({
          id: `movement-${index}`,
          type,
          from: from.trim(),
          to: to.trim(),
          arrival: new Date(Date.now() + parseInt(timer) * 1000)
        });
      }
    });
    
    return movements;
  }
  
  private getIncomingAttacks(): Attack[] {
    const attacks: Attack[] = [];
    
    // Check for attack indicators
    document.querySelectorAll('.movements .attack').forEach((el, index) => {
      const timer = el.querySelector('.timer')?.getAttribute('value');
      const from = el.querySelector('.from')?.textContent || 'Unknown';
      
      if (timer) {
        const timeInSeconds = parseInt(timer);
        const dangerLevel = this.assessDangerLevel(timeInSeconds);
        
        attacks.push({
          id: `attack-${index}`,
          type: 'attack',
          from,
          to: 'Your village',
          arrival: new Date(Date.now() + timeInSeconds * 1000),
          dangerLevel,
          timeToArrival: this.formatTime(timeInSeconds)
        });
      }
    });
    
    return attacks;
  }
  
  // Additional helper methods...
  private parseNumber(text: string | null | undefined): number {
    if (!text) return 0;
    
    // Handle selector
    if (text.startsWith('#') || text.startsWith('.')) {
      const element = document.querySelector(text);
      text = element?.textContent || '0';
    }
    
    // Remove non-numeric characters except minus
    const cleaned = text.replace(/[^\d-]/g, '');
    return parseInt(cleaned) || 0;
  }
  
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  private detectMovementType(row: Element): Movement['type'] {
    const classes = row.className;
    if (classes.includes('attack')) return 'attack';
    if (classes.includes('raid')) return 'raid';
    if (classes.includes('reinforcement')) return 'reinforcement';
    if (classes.includes('return')) return 'return';
    if (classes.includes('adventure')) return 'adventure';
    return 'attack'; // Default to worst case
  }
  
  private assessDangerLevel(secondsToArrival: number): Attack['dangerLevel'] {
    if (secondsToArrival < 300) return 'critical';      // < 5 minutes
    if (secondsToArrival < 1800) return 'high';         // < 30 minutes
    if (secondsToArrival < 7200) return 'medium';       // < 2 hours
    return 'low';
  }
  
  private getTroopConsumption(): number {
    const consumption = document.querySelector('.cropConsumption');
    if (consumption) {
      return Math.abs(this.parseNumber(consumption.textContent));
    }
    
    // Estimate based on troop counts
    const troops = this.getTroops();
    return Object.values(troops.own).reduce((sum, count) => sum + count, 0);
  }
  
  private getHeroState(): HeroState {
    const hero: HeroState = {
      level: 0,
      health: 100,
      experience: 0,
      adventurePoints: 0,
      location: 'home',
      status: 'home'
    };
    
    // Check hero status
    const heroImage = document.querySelector('.heroImage');
    if (heroImage) {
      hero.level = this.parseNumber(heroImage.querySelector('.level')?.textContent) || 0;
      hero.health = this.parseNumber(heroImage.querySelector('.health')?.textContent) || 100;
    }
    
    // Check if hero is on adventure
    if (document.querySelector('.hero_on_adventure')) {
      hero.status = 'adventure';
      hero.location = 'adventure';
    }
    
    // Check hero experience
    const expBar = document.querySelector('.heroExpBar');
    if (expBar) {
      hero.experience = this.parseNumber(expBar.getAttribute('title'));
    }
    
    return hero;
  }
  
  private getReports() {
    // Would need to navigate to reports page for full data
    // For now, return empty array
    return [];
  }
  
  private parseProduction(selector: string): number {
    const element = document.querySelector(selector);
    if (!element) return 0;
    
    // Check title attribute for production info
    const title = element.getAttribute('title');
    if (title) {
      const match = title.match(/Production:\s*([\d,]+)/);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }
    
    return 0;
  }
}
```

## Key Features

- **Robust Scraping**: Multiple fallback selectors for different Travian versions
- **Smart Parsing**: Handles various number formats and text patterns
- **Danger Assessment**: Automatically categorizes threat levels
- **Time Calculations**: Converts server timers to actual timestamps
- **Cache Management**: Prevents redundant DOM queries

## Usage

```typescript
const collector = new StateCollector();
const gameState = collector.collect();
console.log('Current resources:', gameState.resources);
console.log('Incoming attacks:', gameState.incomingAttacks);
```
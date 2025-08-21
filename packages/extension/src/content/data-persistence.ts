// Data Persistence Layer using IndexedDB
// Stores multi-village data and enables historical tracking

interface DBSchema {
  villageSnapshots: {
    id: string; // village_id + timestamp
    villageId: string;
    villageName: string;
    timestamp: number;
    data: VillageData;
  };
  accountSnapshots: {
    id: string; // timestamp
    timestamp: number;
    villages: Map<string, VillageData>;
    aggregates: AccountAggregates;
  };
  gameEvents: {
    id: string;
    timestamp: number;
    type: 'attack' | 'building_complete' | 'trade' | 'report';
    villageId?: string;
    data: any;
  };
}

interface AccountAggregates {
  totalPopulation: number;
  totalProduction: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  totalResources: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  villageCount: number;
  culturePoints: number;
  rank?: number;
}

export class DataPersistence {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'TravianAssistantDB';
  private readonly DB_VERSION = 1;
  
  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to open database');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[TLA DB] Database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('villageSnapshots')) {
          const villageStore = db.createObjectStore('villageSnapshots', { keyPath: 'id' });
          villageStore.createIndex('villageId', 'villageId', { unique: false });
          villageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('accountSnapshots')) {
          const accountStore = db.createObjectStore('accountSnapshots', { keyPath: 'id' });
          accountStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('gameEvents')) {
          const eventStore = db.createObjectStore('gameEvents', { keyPath: 'id' });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventStore.createIndex('type', 'type', { unique: false });
          eventStore.createIndex('villageId', 'villageId', { unique: false });
        }
        
        console.log('[TLA DB] Database schema created');
      };
    });
  }

  public async storeVillageSnapshot(villageData: VillageData): Promise<void> {
    if (!this.db) await this.initialize();
    
    const snapshot = {
      id: `${villageData.villageId}_${villageData.timestamp}`,
      villageId: villageData.villageId,
      villageName: villageData.villageName,
      timestamp: villageData.timestamp,
      data: villageData
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['villageSnapshots'], 'readwrite');
      const store = transaction.objectStore('villageSnapshots');
      const request = store.put(snapshot);
      
      request.onsuccess = () => {
        console.log('[TLA DB] Village snapshot stored:', villageData.villageName);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to store village snapshot');
        reject(request.error);
      };
    });
  }

  public async storeAccountSnapshot(
    villages: Map<string, VillageData>,
    aggregates?: AccountAggregates
  ): Promise<void> {
    if (!this.db) await this.initialize();
    
    // Calculate aggregates if not provided
    const finalAggregates = aggregates || this.calculateAggregates(villages);
    
    const snapshot = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      villages: Array.from(villages.entries()), // Convert Map for storage
      aggregates: finalAggregates
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['accountSnapshots'], 'readwrite');
      const store = transaction.objectStore('accountSnapshots');
      const request = store.put(snapshot);
      
      request.onsuccess = () => {
        console.log('[TLA DB] Account snapshot stored with', villages.size, 'villages');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to store account snapshot');
        reject(request.error);
      };
    });
  }

  public async getVillageHistory(
    villageId: string,
    hoursBack: number = 24
  ): Promise<VillageData[]> {
    if (!this.db) await this.initialize();
    
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['villageSnapshots'], 'readonly');
      const store = transaction.objectStore('villageSnapshots');
      const index = store.index('villageId');
      const range = IDBKeyRange.only(villageId);
      const request = index.openCursor(range);
      
      const results: VillageData[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp >= cutoffTime) {
            results.push(cursor.value.data);
          }
          cursor.continue();
        } else {
          console.log('[TLA DB] Retrieved', results.length, 'snapshots for village:', villageId);
          resolve(results.sort((a, b) => a.timestamp - b.timestamp));
        }
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to retrieve village history');
        reject(request.error);
      };
    });
  }

  /**
   * Get the latest cached snapshot for a specific village
   */
  public async getLatestVillageSnapshot(villageId: string): Promise<VillageData | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['villageSnapshots'], 'readonly');
      const store = transaction.objectStore('villageSnapshots');
      const index = store.index('villageId');
      const range = IDBKeyRange.only(villageId);
      const request = index.openCursor(range, 'prev'); // Get latest for this village
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          console.log('[TLA DB] Found cached data for village:', villageId);
          resolve(cursor.value.data);
        } else {
          console.log('[TLA DB] No cached data for village:', villageId);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to retrieve village snapshot');
        reject(request.error);
      };
    });
  }

  public async getLatestAccountSnapshot(): Promise<{
    villages: Map<string, VillageData>;
    aggregates: AccountAggregates;
  } | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['accountSnapshots'], 'readonly');
      const store = transaction.objectStore('accountSnapshots');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Get latest
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const snapshot = cursor.value;
          resolve({
            villages: new Map(snapshot.villages),
            aggregates: snapshot.aggregates
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to retrieve account snapshot');
        reject(request.error);
      };
    });
  }

  public async storeGameEvent(event: {
    type: 'attack' | 'building_complete' | 'trade' | 'report';
    villageId?: string;
    data: any;
  }): Promise<void> {
    if (!this.db) await this.initialize();
    
    const gameEvent = {
      id: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameEvents'], 'readwrite');
      const store = transaction.objectStore('gameEvents');
      const request = store.put(gameEvent);
      
      request.onsuccess = () => {
        console.log('[TLA DB] Game event stored:', event.type);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[TLA DB] Failed to store game event');
        reject(request.error);
      };
    });
  }

  public async cleanOldData(daysToKeep: number = 7): Promise<void> {
    if (!this.db) await this.initialize();
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const stores = ['villageSnapshots', 'accountSnapshots', 'gameEvents'];
    
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoffTime);
        const request = index.openCursor(range);
        
        let deleteCount = 0;
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            deleteCount++;
            cursor.continue();
          } else {
            console.log(`[TLA DB] Cleaned ${deleteCount} old records from ${storeName}`);
            resolve();
          }
        };
        
        request.onerror = () => {
          console.error(`[TLA DB] Failed to clean ${storeName}`);
          reject(request.error);
        };
      });
    }
  }

  private calculateAggregates(villages: Map<string, VillageData>): AccountAggregates {
    let totalPopulation = 0;
    const totalProduction = { wood: 0, clay: 0, iron: 0, crop: 0 };
    const totalResources = { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    villages.forEach(village => {
      // Add up production
      totalProduction.wood += village.production.wood || 0;
      totalProduction.clay += village.production.clay || 0;
      totalProduction.iron += village.production.iron || 0;
      totalProduction.crop += village.production.crop || 0;
      
      // Add up resources
      totalResources.wood += village.resources.wood || 0;
      totalResources.clay += village.resources.clay || 0;
      totalResources.iron += village.resources.iron || 0;
      totalResources.crop += village.resources.crop || 0;
      
      // Population would need to be calculated from buildings
      // This is a simplified version
      totalPopulation += village.buildings?.length * 5 || 0;
    });
    
    return {
      totalPopulation,
      totalProduction,
      totalResources,
      villageCount: villages.size,
      culturePoints: 0 // Would need specific calculation
    };
  }

  public async exportData(): Promise<string> {
    if (!this.db) await this.initialize();
    
    const data = {
      villageSnapshots: await this.getAllFromStore('villageSnapshots'),
      accountSnapshots: await this.getAllFromStore('accountSnapshots'),
      gameEvents: await this.getAllFromStore('gameEvents'),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  private async getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const dataStore = new DataPersistence();

// Import statement for VillageData type
import type { VillageData } from './village-navigator';
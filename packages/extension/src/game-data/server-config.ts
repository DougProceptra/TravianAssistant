/**
 * Server configuration for Travian speed calculations
 * Critical for accurate time and cost calculations
 */

export interface ServerSettings {
  speed: number;           // Server speed multiplier (1, 2, 3, 5, 10)
  version: string;         // Game version ('t4', 't4.fs', 't5')
  troopSpeed: number;      // Troop movement speed multiplier
  merchantSpeed: number;   // Merchant movement speed multiplier
  buildingSpeed: number;   // Building construction speed multiplier
  unitTrainingSpeed: number; // Unit training speed multiplier
  worldSize: number;       // Map size (401x401, 801x801)
}

// Current server configuration - should be loaded from extension settings
export let ServerConfig: ServerSettings = {
  speed: 2,               // YOUR CURRENT 2x SERVER
  version: 't4',          // Regular Travian Legends
  troopSpeed: 2,          // 2x movement speed
  merchantSpeed: 2,       // 2x merchant speed
  buildingSpeed: 2,       // 2x building speed
  unitTrainingSpeed: 2,   // 2x training speed
  worldSize: 401          // Standard map size
};

// Annual Special configuration (starts Sept 9)
export const AnnualSpecialConfig: ServerSettings = {
  speed: 1,
  version: 't4.fs',       // Fire & Sand variant
  troopSpeed: 1,
  merchantSpeed: 1,
  buildingSpeed: 1,
  unitTrainingSpeed: 1,
  worldSize: 401
};

// Common server presets
export const ServerPresets = {
  '1x': { speed: 1, troopSpeed: 1, merchantSpeed: 1, buildingSpeed: 1, unitTrainingSpeed: 1 },
  '2x': { speed: 2, troopSpeed: 2, merchantSpeed: 2, buildingSpeed: 2, unitTrainingSpeed: 2 },
  '3x': { speed: 3, troopSpeed: 3, merchantSpeed: 3, buildingSpeed: 3, unitTrainingSpeed: 3 },
  '5x': { speed: 5, troopSpeed: 5, merchantSpeed: 5, buildingSpeed: 5, unitTrainingSpeed: 5 },
  '10x': { speed: 10, troopSpeed: 10, merchantSpeed: 10, buildingSpeed: 10, unitTrainingSpeed: 10 }
};

/**
 * Update server configuration (typically from extension settings)
 */
export function updateServerConfig(settings: Partial<ServerSettings>) {
  ServerConfig = { ...ServerConfig, ...settings };
}

/**
 * Load server configuration from Chrome storage
 */
export async function loadServerConfig(): Promise<ServerSettings> {
  try {
    const stored = await chrome.storage.sync.get(['serverSettings']);
    if (stored.serverSettings) {
      ServerConfig = stored.serverSettings;
    }
  } catch (error) {
    console.warn('Could not load server settings, using defaults:', error);
  }
  return ServerConfig;
}

/**
 * Save server configuration to Chrome storage
 */
export async function saveServerConfig(settings: ServerSettings): Promise<void> {
  ServerConfig = settings;
  await chrome.storage.sync.set({ serverSettings: settings });
}

/**
 * Helper functions for speed adjustments
 */

export function adjustTimeForServerSpeed(baseTimeSeconds: number): number {
  return Math.round(baseTimeSeconds / ServerConfig.buildingSpeed);
}

export function adjustTravelTimeForServerSpeed(baseTravelTimeHours: number): number {
  return baseTravelTimeHours / ServerConfig.troopSpeed;
}

export function adjustTrainingTimeForServerSpeed(baseTrainingSeconds: number): number {
  return Math.round(baseTrainingSeconds / ServerConfig.unitTrainingSpeed);
}

export function adjustMerchantTimeForServerSpeed(baseTravelTimeHours: number): number {
  return baseTravelTimeHours / ServerConfig.merchantSpeed;
}

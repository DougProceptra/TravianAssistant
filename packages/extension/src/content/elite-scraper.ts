/**
 * Elite Scraper - Captures ALL game data for top-tier strategic recommendations
 * This module extracts every piece of data visible in the game for AI analysis
 */

export interface EliteGameData {
  // Core identification
  playerId: string;
  playerName: string;
  tribe: 'Romans' | 'Gauls' | 'Teutons' | 'Egyptians' | 'Huns' | 'Spartans' | 'Vikings';
  serverUrl: string;
  serverAge: number; // days since server start
  
  // Complete village data
  villages: EliteVillageData[];
  
  // Military overview
  military: {
    totalTroops: TroopCounts;
    totalDefense: number;
    totalOffense: number;
    hero: HeroData;
    incomingAttacks: Attack[];
    outgoingAttacks: Attack[];
    reinforcements: Reinforcement[];
  };
  
  // Economic overview
  economy: {
    totalProduction: ResourceRates;
    totalResources: ResourceAmounts;
    merchants: MerchantData;
    tradeRoutes: TradeRoute[];
    goldBalance: number;
    plusFeatures: PlusFeatures;
  };
  
  // Strategic data
  strategy: {
    culturePoints: CultureData;
    farmList: FarmTarget[];
    alliance: AllianceData;
    neighbors: NeighborAnalysis[];
    mapControl: MapControl;
    rank: PlayerRank;
  };
  
  // Meta information
  meta: {
    scrapedAt: number;
    scrapingQuality: number; // 0-100 percentage of data captured
    missingData: string[]; // List of data points we couldn't capture
  };
}

export interface EliteVillageData {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  isCapital: boolean;
  
  // Resources
  resources: ResourceAmounts;
  production: ResourceRates;
  storage: {
    warehouse: number;
    warehouseCapacity: number;
    granary: number;
    granaryCapacity: number;
  };
  
  // Buildings - ALL OF THEM
  buildings: {
    fields: FieldBuilding[]; // All 18 resource fields
    village: VillageBuilding[]; // All village buildings
    queue: BuildingQueue[];
  };
  
  // Military
  troops: {
    own: TroopCounts;
    reinforcements: TroopCounts;
    training: TrainingQueue[];
    movement: TroopMovement[];
  };
  
  // Village specifics
  population: number;
  loyalty: number;
  celebration: {
    active: boolean;
    type: 'small' | 'large' | null;
    endsAt: number;
  };
  
  // Oases
  oases: Oasis[];
}

interface ResourceAmounts {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
}

interface ResourceRates {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
  cropNet: number; // After consumption
}

interface FieldBuilding {
  position: number; // 1-18
  type: 'wood' | 'clay' | 'iron' | 'crop';
  level: number;
  upgradeInProgress: boolean;
  upgradeCost: ResourceAmounts;
  upgradeTime: number; // seconds
}

interface VillageBuilding {
  id: number; // Building type ID
  name: string;
  level: number;
  position: number; // Building slot in village
  upgradeInProgress: boolean;
  upgradeCost: ResourceAmounts;
  upgradeTime: number;
  effect: string; // Building effect description
}

interface BuildingQueue {
  buildingName: string;
  level: number;
  completesAt: number;
  canCancel: boolean;
}

interface TroopCounts {
  // Romans
  legionnaire?: number;
  praetorian?: number;
  imperian?: number;
  equitesLegati?: number;
  equitesImperatoris?: number;
  equitesCaesaris?: number;
  batteringRam?: number;
  fireCatapult?: number;
  senator?: number;
  settler?: number;
  
  // Add other tribes...
  [key: string]: number | undefined;
}

interface TrainingQueue {
  troopType: string;
  amount: number;
  completesAt: number;
  building: string; // Barracks, Stable, Workshop
}

interface TroopMovement {
  type: 'attack' | 'raid' | 'support' | 'return' | 'adventure';
  troops: TroopCounts;
  from: string;
  to: string;
  arrivesAt: number;
}

interface HeroData {
  level: number;
  experience: number;
  health: number;
  attack: number;
  defense: number;
  regeneration: number;
  speed: number;
  status: 'home' | 'traveling' | 'adventure' | 'dead';
  equipment: HeroEquipment[];
  resourceBonus: ResourceRates;
}

interface HeroEquipment {
  slot: 'helmet' | 'armor' | 'leftHand' | 'rightHand' | 'boots' | 'horse';
  name: string;
  bonus: string;
}

interface Attack {
  id: string;
  type: 'incoming' | 'outgoing';
  from: { village: string; player: string; alliance: string };
  to: { village: string; player: string; alliance: string };
  arrivesAt: number;
  troopCount?: number; // If scouted
  isRaid: boolean;
}

interface Reinforcement {
  from: string;
  troops: TroopCounts;
  canReturn: boolean;
}

interface MerchantData {
  total: number;
  available: number;
  capacity: number;
  movements: MerchantMovement[];
}

interface MerchantMovement {
  to: string;
  resources: ResourceAmounts;
  returnsAt: number;
}

interface TradeRoute {
  from: string;
  to: string;
  resources: ResourceAmounts;
  frequency: number; // Times per day
  active: boolean;
}

interface PlusFeatures {
  active: boolean;
  expiresAt: number;
  features: {
    buildingQueue: boolean;
    resourceBonus: boolean;
    cropBonus: boolean;
    traderBonus: boolean;
  };
}

interface CultureData {
  current: number;
  production: number; // Per hour
  nextSlot: number;
  villageSlots: {
    used: number;
    total: number;
  };
  celebrations: number; // Total run
}

interface FarmTarget {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  distance: number;
  lastAttack: number;
  averageHaul: ResourceAmounts;
  population: number;
  inactive: boolean;
  protected: boolean;
}

interface AllianceData {
  name: string;
  rank: number;
  members: number;
  role: 'leader' | 'officer' | 'member' | null;
  bonuses: string[];
}

interface NeighborAnalysis {
  playerId: string;
  playerName: string;
  alliance: string;
  distance: number;
  villages: number;
  population: number;
  rank: number;
  activity: 'very active' | 'active' | 'inactive' | 'vacation';
  threat: 'high' | 'medium' | 'low' | 'none';
  lastInteraction: string;
}

interface MapControl {
  controlledOases: number;
  nearbyPlayers: number;
  nearbyAlliances: string[];
  strategicPosition: 'center' | 'border' | 'corner' | 'isolated';
}

interface PlayerRank {
  overall: number;
  attackers: number;
  defenders: number;
  population: number;
  alliance: number;
}

interface Oasis {
  type: string;
  bonus: ResourceRates;
  troops: TroopCounts;
  distance: number;
}

/**
 * Elite Scraper Implementation
 */
export class EliteScraper {
  private gameData: Partial<EliteGameData> = {};
  
  /**
   * Scrape all available data from current page
   */
  public async scrapeCurrentPage(): Promise<Partial<EliteGameData>> {
    console.log('[Elite Scraper] Starting comprehensive data extraction...');
    
    // Reset data
    this.gameData = {
      meta: {
        scrapedAt: Date.now(),
        scrapingQuality: 0,
        missingData: []
      }
    };
    
    // Extract player info
    this.extractPlayerInfo();
    
    // Extract village data
    this.extractVillageData();
    
    // Extract military data
    this.extractMilitaryData();
    
    // Extract economic data
    this.extractEconomicData();
    
    // Extract strategic data
    this.extractStrategicData();
    
    // Calculate scraping quality
    this.calculateScrapingQuality();
    
    console.log('[Elite Scraper] Extraction complete:', this.gameData);
    return this.gameData;
  }
  
  /**
   * Extract player information
   */
  private extractPlayerInfo(): void {
    try {
      // Player name from header
      const playerElement = document.querySelector('.playerName');
      if (playerElement) {
        this.gameData.playerName = playerElement.textContent?.trim() || '';
      }
      
      // Player ID from links
      const profileLink = document.querySelector('a[href*="spieler.php"]');
      if (profileLink) {
        const match = profileLink.getAttribute('href')?.match(/uid=(\d+)/);
        if (match) {
          this.gameData.playerId = match[1];
        }
      }
      
      // Tribe detection
      const tribeClass = document.body.className.match(/tribe(\d)/);
      if (tribeClass) {
        const tribes = ['Romans', 'Teutons', 'Gauls', 'Nature', 'Natars', 'Egyptians', 'Huns', 'Spartans', 'Vikings'];
        this.gameData.tribe = tribes[parseInt(tribeClass[1]) - 1] as any;
      }
      
      // Server info
      this.gameData.serverUrl = window.location.hostname;
      
    } catch (error) {
      console.error('[Elite Scraper] Error extracting player info:', error);
      this.gameData.meta?.missingData?.push('player info');
    }
  }
  
  /**
   * Extract detailed village data
   */
  private extractVillageData(): void {
    try {
      const villages: EliteVillageData[] = [];
      
      // Get current village details
      const currentVillage = this.extractCurrentVillage();
      if (currentVillage) {
        villages.push(currentVillage);
      }
      
      // Get other villages from village list
      const villageList = document.querySelectorAll('.villageList li');
      villageList.forEach(li => {
        if (!li.classList.contains('active')) {
          const basicVillage = this.extractBasicVillageInfo(li);
          if (basicVillage) {
            villages.push(basicVillage as EliteVillageData);
          }
        }
      });
      
      this.gameData.villages = villages;
      
    } catch (error) {
      console.error('[Elite Scraper] Error extracting village data:', error);
      this.gameData.meta?.missingData?.push('village data');
    }
  }
  
  /**
   * Extract current village complete data
   */
  private extractCurrentVillage(): EliteVillageData | null {
    const village: Partial<EliteVillageData> = {};
    
    // Village ID and name
    const activeVillage = document.querySelector('.villageList .active');
    if (activeVillage) {
      const link = activeVillage.querySelector('a');
      if (link) {
        const match = link.getAttribute('href')?.match(/newdid=(\d+)/);
        if (match) {
          village.id = match[1];
        }
        village.name = activeVillage.querySelector('.name')?.textContent?.trim() || '';
      }
    }
    
    // Coordinates
    const coordElement = document.querySelector('.coordinatesWrapper');
    if (coordElement) {
      const coordText = coordElement.textContent || '';
      const match = coordText.match(/\((-?\d+)\|(-?\d+)\)/);
      if (match) {
        village.coordinates = {
          x: parseInt(match[1]),
          y: parseInt(match[2])
        };
      }
    }
    
    // Resources
    village.resources = {
      wood: this.parseNumber('#l1'),
      clay: this.parseNumber('#l2'),
      iron: this.parseNumber('#l3'),
      crop: this.parseNumber('#l4')
    };
    
    // Production (if on dorf1.php)
    const productionTable = document.querySelector('.production');
    if (productionTable) {
      const rows = productionTable.querySelectorAll('tr');
      village.production = {
        wood: this.parseNumber(rows[0]?.querySelector('.num')),
        clay: this.parseNumber(rows[1]?.querySelector('.num')),
        iron: this.parseNumber(rows[2]?.querySelector('.num')),
        crop: this.parseNumber(rows[3]?.querySelector('.num')),
        cropNet: this.parseNumber(rows[4]?.querySelector('.num'))
      };
    }
    
    // Storage
    const warehouse = document.querySelector('.warehouse');
    const granary = document.querySelector('.granary');
    
    village.storage = {
      warehouse: village.resources.wood + village.resources.clay + village.resources.iron,
      warehouseCapacity: this.parseNumber(warehouse?.querySelector('.capacity')),
      granary: village.resources.crop,
      granaryCapacity: this.parseNumber(granary?.querySelector('.capacity'))
    };
    
    // Buildings (resource fields)
    village.buildings = {
      fields: this.extractResourceFields(),
      village: this.extractVillageBuildings(),
      queue: this.extractBuildingQueue()
    };
    
    // Population
    const popElement = document.querySelector('.inhabitants');
    if (popElement) {
      village.population = this.parseNumber(popElement);
    }
    
    // Loyalty (if visible)
    const loyaltyElement = document.querySelector('.loyalty');
    if (loyaltyElement) {
      village.loyalty = this.parseNumber(loyaltyElement);
    } else {
      village.loyalty = 100; // Assume 100 if not visible
    }
    
    // Check for capital
    village.isCapital = !!document.querySelector('.capitalVillage');
    
    // Oases
    village.oases = this.extractOases();
    
    // Troops (if visible)
    village.troops = this.extractVillageTroops();
    
    // Celebration
    village.celebration = this.extractCelebration();
    
    return village as EliteVillageData;
  }
  
  /**
   * Extract resource fields data
   */
  private extractResourceFields(): FieldBuilding[] {
    const fields: FieldBuilding[] = [];
    
    // On dorf1.php (village overview)
    const fieldElements = document.querySelectorAll('.buildingSlot');
    fieldElements.forEach((element, index) => {
      if (index < 18) { // Only resource fields
        const level = this.parseNumber(element.querySelector('.level'));
        const gid = element.className.match(/gid(\d+)/)?.[1];
        
        let type: 'wood' | 'clay' | 'iron' | 'crop' = 'wood';
        if (gid === '1') type = 'wood';
        else if (gid === '2') type = 'clay';
        else if (gid === '3') type = 'iron';
        else if (gid === '4') type = 'crop';
        
        fields.push({
          position: index + 1,
          type,
          level,
          upgradeInProgress: !!element.querySelector('.underConstruction'),
          upgradeCost: this.extractUpgradeCost(element),
          upgradeTime: 0 // Would need to extract from build page
        });
      }
    });
    
    return fields;
  }
  
  /**
   * Extract village buildings
   */
  private extractVillageBuildings(): VillageBuilding[] {
    const buildings: VillageBuilding[] = [];
    
    // On dorf2.php (village center)
    const buildingSlots = document.querySelectorAll('.buildingSlot');
    buildingSlots.forEach((slot, index) => {
      if (index >= 18) { // Village buildings start after fields
        const level = this.parseNumber(slot.querySelector('.level'));
        const name = slot.querySelector('.name')?.textContent?.trim() || '';
        const gid = slot.className.match(/gid(\d+)/)?.[1];
        
        if (gid && level > 0) {
          buildings.push({
            id: parseInt(gid),
            name,
            level,
            position: index - 17, // Adjust for village position
            upgradeInProgress: !!slot.querySelector('.underConstruction'),
            upgradeCost: this.extractUpgradeCost(slot),
            upgradeTime: 0,
            effect: '' // Would need building details
          });
        }
      }
    });
    
    return buildings;
  }
  
  /**
   * Extract building queue
   */
  private extractBuildingQueue(): BuildingQueue[] {
    const queue: BuildingQueue[] = [];
    
    const queueElements = document.querySelectorAll('.buildingList li');
    queueElements.forEach(item => {
      const name = item.querySelector('.name')?.textContent?.trim() || '';
      const level = this.parseNumber(item.querySelector('.lvl'));
      const timer = item.querySelector('.timer');
      
      if (name && timer) {
        const seconds = this.parseTimer(timer.getAttribute('value') || '0');
        queue.push({
          buildingName: name,
          level,
          completesAt: Date.now() + (seconds * 1000),
          canCancel: !!item.querySelector('.cancel')
        });
      }
    });
    
    return queue;
  }
  
  /**
   * Extract village troops
   */
  private extractVillageTroops(): any {
    const troops = {
      own: {} as TroopCounts,
      reinforcements: {} as TroopCounts,
      training: [] as TrainingQueue[],
      movement: [] as TroopMovement[]
    };
    
    // Extract from rally point if visible
    const troopTable = document.querySelector('.troop_details');
    if (troopTable) {
      const rows = troopTable.querySelectorAll('tr');
      rows.forEach(row => {
        const unitClass = row.className.match(/unit u(\d+)/);
        if (unitClass) {
          const unitId = unitClass[1];
          const count = this.parseNumber(row.querySelector('.val'));
          troops.own[`unit${unitId}`] = count;
        }
      });
    }
    
    // Extract training queue
    const trainingElements = document.querySelectorAll('.trainUnits .details');
    trainingElements.forEach(element => {
      const unitName = element.querySelector('.tit')?.textContent?.trim() || '';
      const amount = this.parseNumber(element.querySelector('.desc .amount'));
      const timer = element.querySelector('.timer');
      
      if (unitName && timer) {
        const seconds = this.parseTimer(timer.getAttribute('value') || '0');
        troops.training.push({
          troopType: unitName,
          amount,
          completesAt: Date.now() + (seconds * 1000),
          building: 'Unknown'
        });
      }
    });
    
    return troops;
  }
  
  /**
   * Extract oases information
   */
  private extractOases(): Oasis[] {
    const oases: Oasis[] = [];
    
    const oasisElements = document.querySelectorAll('.oasisList li');
    oasisElements.forEach(element => {
      const typeElement = element.querySelector('.type');
      const bonusElement = element.querySelector('.bonus');
      
      if (typeElement && bonusElement) {
        const type = typeElement.textContent?.trim() || '';
        const bonusText = bonusElement.textContent || '';
        
        // Parse bonus percentages
        const woodBonus = bonusText.match(/wood.*?(\d+)%/)?.[1];
        const clayBonus = bonusText.match(/clay.*?(\d+)%/)?.[1];
        const ironBonus = bonusText.match(/iron.*?(\d+)%/)?.[1];
        const cropBonus = bonusText.match(/crop.*?(\d+)%/)?.[1];
        
        oases.push({
          type,
          bonus: {
            wood: parseInt(woodBonus || '0'),
            clay: parseInt(clayBonus || '0'),
            iron: parseInt(ironBonus || '0'),
            crop: parseInt(cropBonus || '0'),
            cropNet: 0
          },
          troops: {} as TroopCounts,
          distance: 0
        });
      }
    });
    
    return oases;
  }
  
  /**
   * Extract celebration status
   */
  private extractCelebration(): any {
    const celebrationElement = document.querySelector('.celebration');
    if (celebrationElement) {
      const timer = celebrationElement.querySelector('.timer');
      if (timer) {
        const seconds = this.parseTimer(timer.getAttribute('value') || '0');
        const type = celebrationElement.textContent?.includes('large') ? 'large' : 'small';
        
        return {
          active: true,
          type,
          endsAt: Date.now() + (seconds * 1000)
        };
      }
    }
    
    return {
      active: false,
      type: null,
      endsAt: 0
    };
  }
  
  /**
   * Extract military data
   */
  private extractMilitaryData(): void {
    try {
      this.gameData.military = {
        totalTroops: {} as TroopCounts,
        totalDefense: 0,
        totalOffense: 0,
        hero: this.extractHeroData(),
        incomingAttacks: this.extractAttacks('incoming'),
        outgoingAttacks: this.extractAttacks('outgoing'),
        reinforcements: []
      };
      
      // Aggregate troop counts from all villages
      if (this.gameData.villages) {
        this.gameData.villages.forEach(village => {
          if (village.troops?.own) {
            Object.entries(village.troops.own).forEach(([unit, count]) => {
              this.gameData.military!.totalTroops[unit] = 
                (this.gameData.military!.totalTroops[unit] || 0) + count;
            });
          }
        });
      }
      
    } catch (error) {
      console.error('[Elite Scraper] Error extracting military data:', error);
      this.gameData.meta?.missingData?.push('military data');
    }
  }
  
  /**
   * Extract hero data
   */
  private extractHeroData(): HeroData {
    const hero: Partial<HeroData> = {
      level: 0,
      experience: 0,
      health: 100,
      attack: 0,
      defense: 0,
      regeneration: 0,
      speed: 0,
      status: 'home',
      equipment: [],
      resourceBonus: { wood: 0, clay: 0, iron: 0, crop: 0, cropNet: 0 }
    };
    
    // Hero attributes if visible
    const heroElement = document.querySelector('.heroStatus');
    if (heroElement) {
      hero.level = this.parseNumber(heroElement.querySelector('.level'));
      hero.health = this.parseNumber(heroElement.querySelector('.health'));
      hero.experience = this.parseNumber(heroElement.querySelector('.experience'));
    }
    
    // Hero on adventure?
    if (document.querySelector('.hero_on_adventure')) {
      hero.status = 'adventure';
    }
    
    return hero as HeroData;
  }
  
  /**
   * Extract attacks
   */
  private extractAttacks(type: 'incoming' | 'outgoing'): Attack[] {
    const attacks: Attack[] = [];
    
    const selector = type === 'incoming' ? '.incoming_attacks' : '.outgoing_attacks';
    const attackElements = document.querySelectorAll(`${selector} tr`);
    
    attackElements.forEach(element => {
      const timer = element.querySelector('.timer');
      if (timer) {
        const seconds = this.parseTimer(timer.getAttribute('value') || '0');
        const fromElement = element.querySelector('.from');
        const toElement = element.querySelector('.to');
        
        attacks.push({
          id: Math.random().toString(36).substr(2, 9),
          type,
          from: {
            village: fromElement?.querySelector('.village')?.textContent?.trim() || '',
            player: fromElement?.querySelector('.player')?.textContent?.trim() || '',
            alliance: fromElement?.querySelector('.alliance')?.textContent?.trim() || ''
          },
          to: {
            village: toElement?.querySelector('.village')?.textContent?.trim() || '',
            player: toElement?.querySelector('.player')?.textContent?.trim() || '',
            alliance: toElement?.querySelector('.alliance')?.textContent?.trim() || ''
          },
          arrivesAt: Date.now() + (seconds * 1000),
          isRaid: !!element.querySelector('.raid')
        });
      }
    });
    
    return attacks;
  }
  
  /**
   * Extract economic data
   */
  private extractEconomicData(): void {
    try {
      this.gameData.economy = {
        totalProduction: { wood: 0, clay: 0, iron: 0, crop: 0, cropNet: 0 },
        totalResources: { wood: 0, clay: 0, iron: 0, crop: 0 },
        merchants: this.extractMerchantData(),
        tradeRoutes: [],
        goldBalance: this.extractGoldBalance(),
        plusFeatures: this.extractPlusFeatures()
      };
      
      // Aggregate from villages
      if (this.gameData.villages) {
        this.gameData.villages.forEach(village => {
          if (village.production) {
            this.gameData.economy!.totalProduction.wood += village.production.wood;
            this.gameData.economy!.totalProduction.clay += village.production.clay;
            this.gameData.economy!.totalProduction.iron += village.production.iron;
            this.gameData.economy!.totalProduction.crop += village.production.crop;
          }
          if (village.resources) {
            this.gameData.economy!.totalResources.wood += village.resources.wood;
            this.gameData.economy!.totalResources.clay += village.resources.clay;
            this.gameData.economy!.totalResources.iron += village.resources.iron;
            this.gameData.economy!.totalResources.crop += village.resources.crop;
          }
        });
      }
      
    } catch (error) {
      console.error('[Elite Scraper] Error extracting economic data:', error);
      this.gameData.meta?.missingData?.push('economic data');
    }
  }
  
  /**
   * Extract merchant data
   */
  private extractMerchantData(): MerchantData {
    const merchantData: MerchantData = {
      total: 0,
      available: 0,
      capacity: 0,
      movements: []
    };
    
    const merchantElement = document.querySelector('.merchants');
    if (merchantElement) {
      const merchantText = merchantElement.textContent || '';
      const match = merchantText.match(/(\d+)\/(\d+)/);
      if (match) {
        merchantData.available = parseInt(match[1]);
        merchantData.total = parseInt(match[2]);
      }
    }
    
    // Extract movements from marketplace
    const movementElements = document.querySelectorAll('.trading_routes tr');
    movementElements.forEach(element => {
      const timer = element.querySelector('.timer');
      if (timer) {
        const seconds = this.parseTimer(timer.getAttribute('value') || '0');
        const to = element.querySelector('.to')?.textContent?.trim() || '';
        
        merchantData.movements.push({
          to,
          resources: {
            wood: this.parseNumber(element.querySelector('.r1')),
            clay: this.parseNumber(element.querySelector('.r2')),
            iron: this.parseNumber(element.querySelector('.r3')),
            crop: this.parseNumber(element.querySelector('.r4'))
          },
          returnsAt: Date.now() + (seconds * 1000)
        });
      }
    });
    
    return merchantData;
  }
  
  /**
   * Extract gold balance
   */
  private extractGoldBalance(): number {
    const goldElement = document.querySelector('.gold');
    if (goldElement) {
      return this.parseNumber(goldElement);
    }
    return 0;
  }
  
  /**
   * Extract Plus features
   */
  private extractPlusFeatures(): PlusFeatures {
    const plusElement = document.querySelector('.plus');
    const isActive = !!plusElement?.classList.contains('active');
    
    return {
      active: isActive,
      expiresAt: 0, // Would need to extract from account page
      features: {
        buildingQueue: isActive,
        resourceBonus: isActive,
        cropBonus: isActive,
        traderBonus: isActive
      }
    };
  }
  
  /**
   * Extract strategic data
   */
  private extractStrategicData(): void {
    try {
      this.gameData.strategy = {
        culturePoints: this.extractCulturePoints(),
        farmList: [], // Would need farm list page
        alliance: this.extractAllianceData(),
        neighbors: [], // Would need map data
        mapControl: this.extractMapControl(),
        rank: this.extractPlayerRank()
      };
    } catch (error) {
      console.error('[Elite Scraper] Error extracting strategic data:', error);
      this.gameData.meta?.missingData?.push('strategic data');
    }
  }
  
  /**
   * Extract culture points
   */
  private extractCulturePoints(): CultureData {
    const cultureData: CultureData = {
      current: 0,
      production: 0,
      nextSlot: 0,
      villageSlots: {
        used: this.gameData.villages?.length || 0,
        total: 0
      },
      celebrations: 0
    };
    
    const cpElement = document.querySelector('.culture_points');
    if (cpElement) {
      cultureData.current = this.parseNumber(cpElement.querySelector('.current'));
      cultureData.production = this.parseNumber(cpElement.querySelector('.production'));
      cultureData.nextSlot = this.parseNumber(cpElement.querySelector('.next'));
    }
    
    return cultureData;
  }
  
  /**
   * Extract alliance data
   */
  private extractAllianceData(): AllianceData {
    const allianceData: AllianceData = {
      name: '',
      rank: 0,
      members: 0,
      role: null,
      bonuses: []
    };
    
    const allianceElement = document.querySelector('.allianceInfo');
    if (allianceElement) {
      allianceData.name = allianceElement.querySelector('.name')?.textContent?.trim() || '';
      allianceData.rank = this.parseNumber(allianceElement.querySelector('.rank'));
      allianceData.members = this.parseNumber(allianceElement.querySelector('.members'));
    }
    
    return allianceData;
  }
  
  /**
   * Extract map control
   */
  private extractMapControl(): MapControl {
    return {
      controlledOases: this.gameData.villages?.[0]?.oases?.length || 0,
      nearbyPlayers: 0, // Would need map data
      nearbyAlliances: [],
      strategicPosition: 'center' // Would need to calculate
    };
  }
  
  /**
   * Extract player rank
   */
  private extractPlayerRank(): PlayerRank {
    const rank: PlayerRank = {
      overall: 0,
      attackers: 0,
      defenders: 0,
      population: 0,
      alliance: 0
    };
    
    const rankElement = document.querySelector('.playerRank');
    if (rankElement) {
      rank.overall = this.parseNumber(rankElement.querySelector('.rank'));
    }
    
    return rank;
  }
  
  /**
   * Extract basic village info from list item
   */
  private extractBasicVillageInfo(element: Element): Partial<EliteVillageData> {
    const village: Partial<EliteVillageData> = {};
    
    const link = element.querySelector('a');
    if (link) {
      const match = link.getAttribute('href')?.match(/newdid=(\d+)/);
      if (match) {
        village.id = match[1];
      }
    }
    
    village.name = element.querySelector('.name')?.textContent?.trim() || '';
    
    const coordText = element.querySelector('.coords')?.textContent || '';
    const coordMatch = coordText.match(/\((-?\d+)\|(-?\d+)\)/);
    if (coordMatch) {
      village.coordinates = {
        x: parseInt(coordMatch[1]),
        y: parseInt(coordMatch[2])
      };
    }
    
    return village;
  }
  
  /**
   * Extract upgrade cost from element
   */
  private extractUpgradeCost(element: Element): ResourceAmounts {
    return {
      wood: this.parseNumber(element.querySelector('.r1')),
      clay: this.parseNumber(element.querySelector('.r2')),
      iron: this.parseNumber(element.querySelector('.r3')),
      crop: this.parseNumber(element.querySelector('.r4'))
    };
  }
  
  /**
   * Calculate scraping quality
   */
  private calculateScrapingQuality(): void {
    if (!this.gameData.meta) return;
    
    let totalFields = 0;
    let filledFields = 0;
    
    // Check major data categories
    const checks = [
      { field: this.gameData.playerName, weight: 5 },
      { field: this.gameData.playerId, weight: 5 },
      { field: this.gameData.tribe, weight: 5 },
      { field: this.gameData.villages?.length, weight: 10 },
      { field: this.gameData.military?.hero, weight: 10 },
      { field: this.gameData.military?.totalTroops, weight: 15 },
      { field: this.gameData.economy?.totalProduction, weight: 10 },
      { field: this.gameData.economy?.goldBalance, weight: 5 },
      { field: this.gameData.strategy?.culturePoints, weight: 10 },
      { field: this.gameData.strategy?.alliance, weight: 5 },
      { field: this.gameData.strategy?.rank, weight: 5 }
    ];
    
    checks.forEach(check => {
      totalFields += check.weight;
      if (check.field) {
        filledFields += check.weight;
      }
    });
    
    // Check village data completeness
    if (this.gameData.villages && this.gameData.villages.length > 0) {
      const villageChecks = [
        'resources', 'production', 'storage', 'buildings', 'troops'
      ];
      
      villageChecks.forEach(field => {
        totalFields += 3;
        if ((this.gameData.villages![0] as any)[field]) {
          filledFields += 3;
        }
      });
    }
    
    this.gameData.meta.scrapingQuality = Math.round((filledFields / totalFields) * 100);
  }
  
  /**
   * Helper: Parse number from element or string
   */
  private parseNumber(selector: string | Element | null): number {
    if (!selector) return 0;
    
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (!element) return 0;
    
    const text = element.textContent || '0';
    return parseInt(text.replace(/[^\d-]/g, '')) || 0;
  }
  
  /**
   * Helper: Parse timer value
   */
  private parseTimer(value: string): number {
    return parseInt(value) || 0;
  }
}

// Export singleton
export const eliteScraper = new EliteScraper();

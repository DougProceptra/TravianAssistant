/**
 * Game Data Provider for AI Agent
 * Provides structured access to all game data for Claude to perform calculations
 */

import troopData from '../../../../data/troops/travian_all_tribes_complete.json';
import buildingData from '../../../../data/buildings/buildings.json';
import heroMechanics from '../../../../data/hero/hero-mechanics.json';

export class GameDataProvider {
  /**
   * Get all game data formatted for AI context
   * This provides Claude with complete game rules and formulas
   */
  getCompleteGameContext() {
    return {
      description: "Complete Travian game mechanics and data",
      
      formulas: {
        troopTraining: "base_time * 0.9^(building_level - 1)",
        greatBuildingBonus: "Divides training time by 3 for barracks/stable",
        buildTime: "base_time * (1 / (1 + MB_level * 0.05))",
        travelTime: "distance / (speed * server_speed)",
        production: "base_production * (1 + bonus_percent / 100)",
        combat: "Complex - involves attack/defense values, wall bonus, morale, etc."
      },
      
      tribes: this.getTribesData(),
      buildings: this.getBuildingsData(),
      hero: this.getHeroData(),
      
      gameRules: {
        settlementRequirements: {
          buildings: "Residence or Palace level 10/15/20",
          culturePoints: "Varies by number of villages",
          settlers: "3 required per new village"
        },
        combatMechanics: {
          morale: "Affects combat when attacking smaller players",
          wall: "Defensive bonus varies by tribe",
          catapults: "Can target specific buildings",
          rams: "Reduce wall level"
        }
      }
    };
  }

  /**
   * Get specific troop data for AI analysis
   */
  getTroopData(tribe?: string, troopName?: string) {
    if (tribe && troopName) {
      const tribeData = troopData.tribes[tribe];
      return tribeData?.find(t => t.name === troopName);
    }
    if (tribe) {
      return troopData.tribes[tribe];
    }
    return troopData;
  }

  /**
   * Get building data for AI analysis
   */
  getBuildingData(buildingName?: string) {
    if (buildingName) {
      return buildingData[buildingName];
    }
    return buildingData;
  }

  /**
   * Format current game state for AI analysis
   * This is what the extension scrapes from the game
   */
  formatGameStateForAI(scrapedData: any) {
    return {
      timestamp: Date.now(),
      serverTime: scrapedData.serverTime,
      
      currentVillage: {
        name: scrapedData.villageName,
        coordinates: scrapedData.coordinates,
        resources: scrapedData.resources,
        production: scrapedData.production,
        capacity: scrapedData.capacity,
        buildings: scrapedData.buildings,
        troops: scrapedData.troops,
        queues: scrapedData.queues
      },
      
      pageContext: {
        pageType: scrapedData.pageType, // 'village', 'reports', 'rally_point', etc.
        pageContent: scrapedData.pageContent,
        availableActions: scrapedData.actions
      },
      
      empire: {
        villages: scrapedData.allVillages,
        totalPopulation: scrapedData.population,
        culturePoints: scrapedData.culturePoints
      }
    };
  }

  /**
   * Create AI prompt with full context
   */
  createAIPrompt(userQuestion: string, gameState: any) {
    return {
      system: `You are an expert Travian advisor with access to complete game data and formulas.
               
               Available data:
               - Complete troop stats for all tribes (attack, defense, speed, cost, training time)
               - Building costs and construction times for levels 1-20
               - Hero mechanics and bonuses by tribe
               - Game formulas for all calculations
               
               Training time formula: base_time * 0.9^(building_level - 1)
               Great Barracks/Stable divide training time by 3
               
               Current game state is provided in the user message.
               Provide specific, actionable advice with exact numbers and timings.`,
      
      user: {
        question: userQuestion,
        gameState: gameState,
        gameData: this.getCompleteGameContext()
      }
    };
  }

  /**
   * Helper methods for common AI queries
   */
  getDataForSettlementAnalysis(tribe: string) {
    const settlers = this.getTroopData(tribe)?.find(t => t.unit_type === 'settler');
    const residenceData = this.getBuildingData('residence');
    
    return {
      settlerCost: settlers?.cost,
      settlerTrainingTime: settlers?.training_time,
      residenceRequirements: residenceData?.levels[9], // Level 10 data
      formula: "Training: 3 settlers * (base_time * 0.9^9) seconds at Residence 10"
    };
  }

  getDataForRaidAnalysis(tribe: string) {
    const troops = this.getTroopData(tribe);
    const raidTroops = troops?.filter(t => 
      t.building === 'barracks' && 
      t.carry > 0 && 
      t.cost.wood + t.cost.clay + t.cost.iron + t.cost.crop < 500
    );
    
    return {
      cheapRaiders: raidTroops,
      efficiency: raidTroops?.map(t => ({
        name: t.name,
        costPerCarry: (t.cost.wood + t.cost.clay + t.cost.iron + t.cost.crop) / t.carry,
        speed: t.speed,
        trainingTime: t.training_time
      }))
    };
  }

  private getTribesData() {
    return {
      available: Object.keys(troopData.tribes),
      data: troopData.tribes,
      specialties: {
        Roman: "Double build queue, strong defense, expensive",
        Teutonic: "Cheap troops, strong offense, slow",
        Gallic: "Fast troops, good defense, fastest cavalry",
        Egyptian: "Resource bonus, cheap starter unit (Slave Militia)",
        Huns: "Command center, mobile troops, no defenses needed",
        Spartan: "Strong elite units, defensive bonuses",
        Viking: "Balanced units, good raiders"
      }
    };
  }

  private getBuildingsData() {
    return {
      available: Object.keys(buildingData || {}),
      categories: {
        resources: ["Woodcutter", "Clay Pit", "Iron Mine", "Cropland"],
        infrastructure: ["Warehouse", "Granary", "Main Building"],
        military: ["Barracks", "Stable", "Workshop", "Academy"],
        defensive: ["Wall", "Earth Wall", "Palisade"],
        special: ["Residence", "Palace", "Treasury", "Trade Office"]
      }
    };
  }

  private getHeroData() {
    return {
      mechanics: heroMechanics || {
        resourceProduction: "3 resources/hour per point at 1x speed",
        egyptianBonus: "25% bonus to resource production",
        combatStrength: "Varies by tribe - Romans 100/point, Teutons 80/point",
        experience: "Gained from adventures and combat"
      }
    };
  }
}

// Export singleton instance for use in extension
export const gameDataProvider = new GameDataProvider();
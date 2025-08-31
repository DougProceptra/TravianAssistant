/**
 * Troop Training Calculator for Travian
 * Calculates training times, costs, and optimal production strategies
 */

import troopData from '../../../../data/troops/travian_all_tribes_complete.json';

export interface TroopTrainingRequest {
  tribe: string;
  troopName: string;
  quantity: number;
  buildingLevel: number;
  hasGreatBuilding?: boolean;
  hasArtefact?: boolean; // 0.5x or 1.5x training time
  serverSpeed?: number;
}

export interface TroopTrainingResult {
  troop: {
    name: string;
    building: string;
    stats: {
      attack: number;
      def_infantry: number;
      def_cavalry: number;
      speed: number;
    };
  };
  cost: {
    total: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
    perUnit: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
  };
  time: {
    perUnit: number; // seconds
    total: number; // seconds
    formatted: string; // "2h 34m 12s"
  };
  carry: {
    perUnit: number;
    total: number;
  };
  upkeep: {
    perUnit: number;
    total: number;
  };
  analysis: {
    efficiency: number; // cost per attack/defense point
    raidROI: number; // carry capacity vs cost
    trainingBuilding: string;
    recommendedLevel: number; // optimal building level for this quantity
  };
}

export class TroopTrainingCalculator {
  private troopData = troopData;

  /**
   * Calculate training time and cost for troops
   */
  calculate(request: TroopTrainingRequest): TroopTrainingResult | null {
    const tribeData = this.troopData.tribes[request.tribe];
    if (!tribeData) {
      console.error(`Tribe ${request.tribe} not found`);
      return null;
    }

    const troop = tribeData.find(t => t.name === request.troopName);
    if (!troop) {
      console.error(`Troop ${request.troopName} not found in ${request.tribe}`);
      return null;
    }

    // Calculate
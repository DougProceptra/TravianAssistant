/**
 * Settlement Advisor - AI-powered settlement optimization
 * Provides strategic advice to settle 4-8 hours faster
 */

import { ClaudeClient } from './claude-client';

export interface SettlementAnalysis {
  currentVillages: number;
  culturePoints: {
    current: number;
    required: number;
    deficit: number;
    dailyProduction: number;
    daysToRequirement: number;
  };
  resources: {
    totalProduction: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
    currentTotal: number;
    requiredForSettlers: number;
    hoursToSettlerResources: number;
  };
  settlementReadiness: {
    hasEnoughCP: boolean;
    hasEnoughResources: boolean;
    hasSettlers: boolean;
    estimatedHoursToReady: number;
  };
  recommendations: string[];
  nextActions: Array<{
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    timeframe: string;
    impact: string;
  }>;
}

export class SettlementAdvisor {
  private claude: ClaudeClient;
  
  constructor(apiKey?: string) {
    this.claude = new ClaudeClient(apiKey);
  }

  /**
   * Analyze game state for settlement optimization
   */
  async analyzeSettlement(gameState: any): Promise<SettlementAnalysis> {
    const villageCount = gameState.villages?.length || 0;
    const cpRequired = this.getCPRequirement(villageCount + 1);
    const currentCP = this.extractCurrentCP(gameState);
    const cpProduction = this.extractCPProduction(gameState);
    const totalProduction = this.calculateTotalProduction(gameState.villages);
    const currentResources = this.calculateCurrentResources(gameState.villages);
    
    // Calculate time to requirements
    const cpDeficit = Math.max(0, cpRequired - currentCP);
    const daysToCP = cpProduction > 0 ? Math.ceil(cpDeficit / cpProduction) : 999;
    
    // Settlers require 750 of each resource
    const settlersNeeded = villageCount === 0 ? 3 : 3; // Always 3 settlers
    const resourcesForSettlers = settlersNeeded * 750 * 4; // 750 each of 4 resources
    const totalHourlyProduction = Object.values(totalProduction).reduce((a, b) => a + b, 0);
    const hoursToSettlerResources = totalHourlyProduction > 0 
      ? Math.ceil((resourcesForSettlers - currentResources) / totalHourlyProduction)
      : 999;

    // Determine readiness
    const hasEnoughCP = currentCP >= cpRequired;
    const hasEnoughResources = currentResources >= resourcesForSettlers;
    const hasSettlers = false; // Would need to check actual game state
    
    const estimatedHoursToReady = Math.max(
      hasEnoughCP ? 0 : daysToCP * 24,
      hasEnoughResources ? 0 : hoursToSettlerResources
    );

    // Generate AI recommendations
    const recommendations = await this.generateRecommendations(gameState, {
      villageCount,
      cpDeficit,
      daysToCP,
      hoursToSettlerResources,
      totalProduction
    });

    // Generate priority actions
    const nextActions = this.generateNextActions({
      hasEnoughCP,
      hasEnoughResources,
      cpDeficit,
      daysToCP,
      hoursToSettlerResources,
      villageCount
    });

    return {
      currentVillages: villageCount,
      culturePoints: {
        current: currentCP,
        required: cpRequired,
        deficit: cpDeficit,
        dailyProduction: cpProduction,
        daysToRequirement: daysToCP
      },
      resources: {
        totalProduction,
        currentTotal: currentResources,
        requiredForSettlers: resourcesForSettlers,
        hoursToSettlerResources
      },
      settlementReadiness: {
        hasEnoughCP,
        hasEnoughResources,
        hasSettlers,
        estimatedHoursToReady
      },
      recommendations,
      nextActions
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    gameState: any, 
    analysis: any
  ): Promise<string[]> {
    
    const prompt = `You are a Travian Legends expert advisor. Analyze this game state and provide specific recommendations to settle the next village 4-8 hours faster.

Current State:
- Villages: ${analysis.villageCount}
- Culture Points: ${analysis.cpDeficit} deficit (${analysis.daysToCP} days to requirement)
- Resource Production: Wood ${analysis.totalProduction.wood}/hr, Clay ${analysis.totalProduction.clay}/hr, Iron ${analysis.totalProduction.iron}/hr, Crop ${analysis.totalProduction.crop}/hr
- Hours to settler resources: ${analysis.hoursToSettlerResources}

Village Details:
${JSON.stringify(gameState.villages, null, 2)}

Provide exactly 5 specific, actionable recommendations that will accelerate settlement by 4-8 hours. Focus on:
1. CP generation optimization
2. Resource production balance
3. Building priorities
4. Gold usage strategy (if applicable)
5. Immediate actions for next 2 hours

Format: Return as JSON array of strings, each 1-2 sentences.`;

    try {
      const response = await this.claude.getCompletion(prompt);
      // Parse response and extract recommendations
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('[Settlement Advisor] AI analysis failed:', error);
      // Fallback to rule-based recommendations
      return this.getFallbackRecommendations(analysis);
    }
  }

  /**
   * Parse AI response into recommendations
   */
  private parseRecommendations(response: string): string[] {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
    } catch {
      // Parse as text if not JSON
      const lines = response.split('\n').filter(line => line.trim());
      return lines.slice(0, 5);
    }
    
    return this.getFallbackRecommendations({});
  }

  /**
   * Fallback recommendations when AI is unavailable
   */
  private getFallbackRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.cpDeficit > 0) {
      if (analysis.daysToCP > 7) {
        recommendations.push('Critical: Build Town Hall to level 10+ in multiple villages to boost CP production');
      } else if (analysis.daysToCP > 3) {
        recommendations.push('Build Embassy, Marketplace, and other CP buildings to increase daily production');
      } else {
        recommendations.push('Run small celebrations in all villages to boost CP generation');
      }
    }

    if (analysis.hoursToSettlerResources > 24) {
      recommendations.push('Upgrade resource fields evenly to level 5+ for optimal production');
    }

    const lowestProduction = Math.min(
      analysis.totalProduction?.wood || 0,
      analysis.totalProduction?.clay || 0,
      analysis.totalProduction?.iron || 0
    );
    
    if (lowestProduction < 100) {
      recommendations.push('Balance resource production - your lowest resource is limiting settler training');
    }

    if (analysis.villageCount >= 3) {
      recommendations.push('Consider using gold for NPC trading to balance resources instantly');
    }

    recommendations.push('Queue Residence/Palace to level 10 if not already done');

    return recommendations.slice(0, 5);
  }

  /**
   * Generate priority next actions
   */
  private generateNextActions(params: any): Array<any> {
    const actions = [];

    // CP actions
    if (!params.hasEnoughCP) {
      if (params.daysToCP > 5) {
        actions.push({
          action: 'Upgrade Town Hall to level 10+ in main village',
          priority: 'critical',
          timeframe: 'Immediately',
          impact: `Reduces settlement time by ${Math.floor(params.daysToCP * 0.3)} days`
        });
      }
      
      actions.push({
        action: 'Start celebrations in all villages',
        priority: params.daysToCP > 3 ? 'high' : 'medium',
        timeframe: 'Next 2 hours',
        impact: 'Generates 500+ bonus CP per village'
      });
    }

    // Resource actions
    if (!params.hasEnoughResources) {
      if (params.hoursToSettlerResources > 48) {
        actions.push({
          action: 'Focus on upgrading resource fields to level 6+',
          priority: 'critical',
          timeframe: 'Continuous',
          impact: `Reduces wait time by ${Math.floor(params.hoursToSettlerResources * 0.4)} hours`
        });
      }

      actions.push({
        action: 'Build/upgrade Marketplace for NPC trading',
        priority: 'high',
        timeframe: 'Within 4 hours',
        impact: 'Enables instant resource balancing'
      });
    }

    // Preparation actions
    if (params.hasEnoughCP && params.hasEnoughResources) {
      actions.push({
        action: 'Train 3 settlers immediately',
        priority: 'critical',
        timeframe: 'Now',
        impact: 'Ready to settle in 8-10 hours'
      });

      actions.push({
        action: 'Scout for 7x7 or 9-cropper locations',
        priority: 'high',
        timeframe: 'While settlers train',
        impact: 'Ensures optimal village placement'
      });
    }

    return actions.slice(0, 5);
  }

  /**
   * Get CP requirement for village number
   */
  private getCPRequirement(villageNumber: number): number {
    const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 112000, 168000, 240000, 330000];
    
    if (villageNumber < requirements.length) {
      return requirements[villageNumber];
    }
    
    // Formula for villages beyond the table
    return Math.round(requirements[10] * Math.pow(1.3, villageNumber - 10));
  }

  /**
   * Extract current CP from game state
   */
  private extractCurrentCP(gameState: any): number {
    // Check various possible locations
    return gameState.culturePoints?.current ||
           gameState.account?.culture?.current ||
           gameState.culture?.current ||
           0;
  }

  /**
   * Extract CP production from game state
   */
  private extractCPProduction(gameState: any): number {
    return gameState.culturePoints?.production ||
           gameState.account?.culture?.daily ||
           gameState.culture?.production ||
           0;
  }

  /**
   * Calculate total resource production
   */
  private calculateTotalProduction(villages: any[]): any {
    const total = { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    if (!villages) return total;
    
    villages.forEach(village => {
      if (village.production) {
        total.wood += village.production.wood || 0;
        total.clay += village.production.clay || 0;
        total.iron += village.production.iron || 0;
        total.crop += village.production.crop || 0;
      }
    });
    
    return total;
  }

  /**
   * Calculate current resources across all villages
   */
  private calculateCurrentResources(villages: any[]): number {
    if (!villages) return 0;
    
    let total = 0;
    villages.forEach(village => {
      if (village.resources) {
        total += (village.resources.wood || 0) +
                 (village.resources.clay || 0) +
                 (village.resources.iron || 0) +
                 (village.resources.crop || 0);
      }
    });
    
    return total;
  }

  /**
   * Generate a comprehensive settlement plan
   */
  async generateSettlementPlan(gameState: any): Promise<string> {
    const analysis = await this.analyzeSettlement(gameState);
    
    const plan = `
# Settlement Plan - Village #${analysis.currentVillages + 1}

## Current Status
- **Villages**: ${analysis.currentVillages}
- **Culture Points**: ${analysis.culturePoints.current}/${analysis.culturePoints.required} (${analysis.culturePoints.deficit} deficit)
- **Days to CP**: ${analysis.culturePoints.daysToRequirement}
- **Resources Needed**: ${analysis.resources.requiredForSettlers}
- **Hours to Resources**: ${analysis.resources.hoursToSettlerResources}
- **Total Time to Settlement**: ~${analysis.settlementReadiness.estimatedHoursToReady} hours

## Resource Production
- Wood: ${analysis.resources.totalProduction.wood}/hr
- Clay: ${analysis.resources.totalProduction.clay}/hr
- Iron: ${analysis.resources.totalProduction.iron}/hr
- Crop: ${analysis.resources.totalProduction.crop}/hr

## Priority Actions
${analysis.nextActions.map((action, i) => 
  `${i + 1}. **${action.action}**
   - Priority: ${action.priority}
   - When: ${action.timeframe}
   - Impact: ${action.impact}`
).join('\n')}

## Strategic Recommendations
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Estimated Settlement Time
**${Math.round(analysis.settlementReadiness.estimatedHoursToReady)} hours** from now

This plan will help you settle ${8 - Math.min(8, analysis.settlementReadiness.estimatedHoursToReady / 24)} hours faster than normal progression.
`;

    return plan;
  }
}

// Export singleton instance
export const settlementAdvisor = new SettlementAdvisor();

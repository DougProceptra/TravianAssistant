#!/usr/bin/env node

/**
 * Local AI Agent Test - Simulates the full AI interaction locally
 * Run with: node test-ai-agent-local.js
 * 
 * This simulates what the Chrome extension will do:
 * 1. Provide game state
 * 2. Ask questions
 * 3. Get AI-powered answers using the game data
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Load game data
class GameDataProvider {
  constructor() {
    console.log(`${colors.cyan}Loading game data...${colors.reset}`);
    this.troopData = this.loadJSON('data/troops/travian_all_tribes_complete.json');
    this.buildingData = this.loadJSON('data/buildings/travian_complete_buildings_data.json');
    
    if (this.troopData && this.buildingData) {
      console.log(`${colors.green}✓ Game data loaded successfully!${colors.reset}\n`);
    }
  }

  loadJSON(filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`${colors.red}Error loading ${filePath}: ${error.message}${colors.reset}`);
      return null;
    }
  }

  getTroopData(tribe, troopName) {
    if (!this.troopData) return null;
    
    if (tribe && troopName) {
      const tribeData = this.troopData.tribes[tribe];
      return tribeData?.find(t => t.name === troopName);
    }
    if (tribe) {
      return this.troopData.tribes[tribe];
    }
    return this.troopData;
  }

  calculateTroopTraining(tribe, troopName, buildingLevel, isGreat = false) {
    const troop = this.getTroopData(tribe, troopName);
    if (!troop) return null;
    
    let time = troop.training_time * Math.pow(0.9, buildingLevel - 1);
    if (isGreat) time = time / 3;
    
    return {
      troopName: troop.name,
      baseTime: troop.training_time,
      buildingLevel: buildingLevel,
      isGreat: isGreat,
      calculatedTime: Math.round(time),
      timeFormatted: this.formatTime(Math.round(time)),
      cost: troop.cost,
      carry: troop.carry,
      speed: troop.speed
    };
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  getSettlementRequirements(tribe) {
    const troops = this.getTroopData(tribe);
    if (!troops) return null;
    
    const settler = troops.find(t => t.unit_type === 'settler');
    if (!settler) return null;
    
    return {
      settlerName: settler.name,
      costPerSettler: settler.cost,
      totalCost: {
        wood: settler.cost.wood * 3,
        clay: settler.cost.clay * 3,
        iron: settler.cost.iron * 3,
        crop: settler.cost.crop * 3
      },
      trainingTimePerSettler: settler.training_time,
      totalTrainingTime: settler.training_time * 3,
      residenceRequired: 10
    };
  }

  getRaidEfficiency(tribe) {
    const troops = this.getTroopData(tribe);
    if (!troops) return null;
    
    const raidTroops = troops
      .filter(t => t.building === 'barracks' && t.carry > 0)
      .map(t => {
        const totalCost = t.cost.wood + t.cost.clay + t.cost.iron + t.cost.crop;
        return {
          name: t.name,
          cost: totalCost,
          carry: t.carry,
          costPerCarry: totalCost / t.carry,
          speed: t.speed,
          training: t.training_time
        };
      })
      .sort((a, b) => a.costPerCarry - b.costPerCarry);
    
    return raidTroops.slice(0, 3); // Top 3 most efficient
  }
}

// Simulated AI Agent (in production, this would call Claude API)
class LocalAIAgent {
  constructor(dataProvider) {
    this.dataProvider = dataProvider;
    this.gameState = this.getDefaultGameState();
  }

  getDefaultGameState() {
    return {
      tribe: 'Egyptian',
      serverSpeed: '1x',
      serverDay: 1,
      villages: [{
        name: 'Village 1',
        coordinates: { x: 0, y: 0 },
        resources: { wood: 750, clay: 750, iron: 750, crop: 750 },
        production: { wood: 100, clay: 100, iron: 100, crop: 50 },
        buildings: {
          barracks: 1,
          residence: 1,
          main_building: 1,
          warehouse: 1,
          granary: 1
        },
        fields: {
          wood: [2, 2, 2, 2],
          clay: [2, 2, 2, 2],
          iron: [2, 2, 2, 2],
          crop: [2, 2, 2, 2, 2, 2]
        }
      }]
    };
  }

  processQuestion(question) {
    const q = question.toLowerCase();
    
    // Settlement timing
    if (q.includes('settle') || q.includes('settlement')) {
      return this.analyzeSettlement();
    }
    
    // Troop training
    if (q.includes('train') || q.includes('troop')) {
      return this.analyzeTroopTraining();
    }
    
    // Raiding
    if (q.includes('raid') || q.includes('farm')) {
      return this.analyzeRaiding();
    }
    
    // Resource management
    if (q.includes('resource') || q.includes('production')) {
      return this.analyzeResources();
    }
    
    // Building priorities
    if (q.includes('build') || q.includes('upgrade')) {
      return this.analyzeBuildingPriorities();
    }
    
    // Game state
    if (q.includes('status') || q.includes('state')) {
      return this.showGameState();
    }
    
    // Help
    if (q.includes('help')) {
      return this.showHelp();
    }
    
    return this.generalAdvice(question);
  }

  analyzeSettlement() {
    const reqs = this.dataProvider.getSettlementRequirements(this.gameState.tribe);
    const village = this.gameState.villages[0];
    
    let response = `${colors.bright}Settlement Analysis for ${this.gameState.tribe}:${colors.reset}\n\n`;
    
    response += `Current Status:\n`;
    response += `  Server Day: ${this.gameState.serverDay}\n`;
    response += `  Resources: ${village.resources.wood}/${village.resources.clay}/${village.resources.iron}/${village.resources.crop}\n`;
    response += `  Production: ${village.production.wood}/${village.production.clay}/${village.production.iron}/${village.production.crop} per hour\n\n`;
    
    response += `Settlement Requirements:\n`;
    response += `  3x ${reqs.settlerName}: ${reqs.totalCost.wood}W ${reqs.totalCost.clay}C ${reqs.totalCost.iron}I ${reqs.totalCost.crop}Crop\n`;
    response += `  Residence Level: ${reqs.residenceRequired} (current: ${village.buildings.residence})\n`;
    response += `  Training Time: ${this.dataProvider.formatTime(reqs.totalTrainingTime)} total\n\n`;
    
    // Calculate time to resources
    const totalNeeded = reqs.totalCost.wood + reqs.totalCost.clay + reqs.totalCost.iron + reqs.totalCost.crop;
    const totalCurrent = village.resources.wood + village.resources.clay + village.resources.iron + village.resources.crop;
    const totalProduction = village.production.wood + village.production.clay + village.production.iron + village.production.crop;
    const hoursToResources = Math.max(0, (totalNeeded - totalCurrent) / totalProduction);
    
    response += `${colors.yellow}Recommendations:${colors.reset}\n`;
    response += `1. Upgrade Residence to level ${reqs.residenceRequired} (priority!)\n`;
    response += `2. Time to gather resources: ~${Math.ceil(hoursToResources)} hours\n`;
    response += `3. Start training settlers when Residence is level 10\n`;
    response += `4. Expected settlement: Day ${Math.max(6, this.gameState.serverDay + Math.ceil(hoursToResources / 24) + 2)}\n`;
    
    return response;
  }

  analyzeTroopTraining() {
    const village = this.gameState.villages[0];
    const barracksLevel = village.buildings.barracks || 1;
    
    let response = `${colors.bright}Troop Training Analysis:${colors.reset}\n\n`;
    response += `Current Barracks Level: ${barracksLevel}\n\n`;
    
    // Get cheapest units for early game
    const slaveMilitia = this.dataProvider.calculateTroopTraining(this.gameState.tribe, 'Slave Militia', barracksLevel);
    const ashWarden = this.dataProvider.calculateTroopTraining(this.gameState.tribe, 'Ash Warden', barracksLevel);
    
    if (slaveMilitia) {
      response += `${colors.green}Slave Militia:${colors.reset}\n`;
      response += `  Cost: ${slaveMilitia.cost.wood}W ${slaveMilitia.cost.clay}C ${slaveMilitia.cost.iron}I ${slaveMilitia.cost.crop}Crop\n`;
      response += `  Training: ${slaveMilitia.timeFormatted}\n`;
      response += `  Carry: ${slaveMilitia.carry} | Speed: ${slaveMilitia.speed} fields/hour\n\n`;
    }
    
    if (ashWarden) {
      response += `${colors.green}Ash Warden:${colors.reset}\n`;
      response += `  Cost: ${ashWarden.cost.wood}W ${ashWarden.cost.clay}C ${ashWarden.cost.iron}I ${ashWarden.cost.crop}Crop\n`;
      response += `  Training: ${ashWarden.timeFormatted}\n`;
      response += `  Carry: ${ashWarden.carry} | Speed: ${ashWarden.speed} fields/hour\n\n`;
    }
    
    response += `${colors.yellow}Recommendations:${colors.reset}\n`;
    response += `1. Start with 5-10 Slave Militia for early raiding\n`;
    response += `2. Upgrade Barracks to level 3 minimum for faster training\n`;
    response += `3. Build 20+ units before first farming run\n`;
    
    return response;
  }

  analyzeRaiding() {
    const efficiency = this.dataProvider.getRaidEfficiency(this.gameState.tribe);
    
    let response = `${colors.bright}Raiding Efficiency Analysis:${colors.reset}\n\n`;
    response += `Top 3 Most Efficient Raid Units:\n\n`;
    
    efficiency.forEach((unit, index) => {
      response += `${index + 1}. ${colors.green}${unit.name}${colors.reset}\n`;
      response += `   Cost per carry: ${unit.costPerCarry.toFixed(2)} resources\n`;
      response += `   Speed: ${unit.speed} fields/hour\n`;
      response += `   Training: ${this.dataProvider.formatTime(unit.training)}\n\n`;
    });
    
    response += `${colors.yellow}Raiding Strategy:${colors.reset}\n`;
    response += `1. Scout first - never raid blind\n`;
    response += `2. Target inactive players (no alliance, low pop)\n`;
    response += `3. Start with nearest targets (< 10 fields)\n`;
    response += `4. Raid oases after building 20+ troops\n`;
    
    return response;
  }

  analyzeResources() {
    const village = this.gameState.villages[0];
    
    let response = `${colors.bright}Resource Analysis:${colors.reset}\n\n`;
    response += `Current Production:\n`;
    response += `  Wood: ${village.production.wood}/hour\n`;
    response += `  Clay: ${village.production.clay}/hour\n`;
    response += `  Iron: ${village.production.iron}/hour\n`;
    response += `  Crop: ${village.production.crop}/hour (net)\n`;
    response += `  Total: ${village.production.wood + village.production.clay + village.production.iron + village.production.crop}/hour\n\n`;
    
    response += `${colors.yellow}Optimization Tips:${colors.reset}\n`;
    response += `1. Keep resources balanced early game\n`;
    response += `2. Prioritize crop fields for troop support\n`;
    response += `3. Upgrade lowest level fields first (best ROI)\n`;
    response += `4. Build to level 5 all fields before going higher\n`;
    
    return response;
  }

  analyzeBuildingPriorities() {
    const village = this.gameState.villages[0];
    
    let response = `${colors.bright}Building Priority Analysis:${colors.reset}\n\n`;
    response += `Current Buildings:\n`;
    Object.entries(village.buildings).forEach(([building, level]) => {
      response += `  ${building.replace(/_/g, ' ')}: Level ${level}\n`;
    });
    
    response += `\n${colors.yellow}Priority Order (Server Day ${this.gameState.serverDay}):${colors.reset}\n`;
    response += `1. Main Building to 5 (faster construction)\n`;
    response += `2. Warehouse/Granary as needed\n`;
    response += `3. Barracks to 3 (troop production)\n`;
    response += `4. Marketplace at level 1 (NPC trading)\n`;
    response += `5. Residence to 10 (for settling)\n`;
    response += `6. Academy at level 10 (research settlers)\n`;
    
    return response;
  }

  showGameState() {
    return `${colors.bright}Current Game State:${colors.reset}\n${JSON.stringify(this.gameState, null, 2)}`;
  }

  showHelp() {
    return `${colors.bright}Available Questions:${colors.reset}
    
  ${colors.green}Settlement:${colors.reset} "When should I settle?" / "Settlement timing"
  ${colors.green}Troops:${colors.reset} "What troops to train?" / "Training analysis"
  ${colors.green}Raiding:${colors.reset} "Best raid units?" / "Raiding strategy"
  ${colors.green}Resources:${colors.reset} "Resource analysis" / "Production optimization"
  ${colors.green}Building:${colors.reset} "What to build next?" / "Building priorities"
  ${colors.green}Status:${colors.reset} "Show game state" / "Current status"
  
  ${colors.yellow}Commands:${colors.reset}
  'set tribe [Roman/Teutonic/Gallic/Egyptian/Huns/Spartan/Viking]'
  'set day [number]'
  'set resources [wood] [clay] [iron] [crop]'
  'set building [name] [level]'
  'exit' to quit`;
  }

  generalAdvice(question) {
    return `${colors.cyan}AI Analysis:${colors.reset}
    
I understand you're asking about: "${question}"

Based on your ${this.gameState.tribe} tribe on server day ${this.gameState.serverDay}, here are key priorities:

1. ${colors.yellow}Immediate:${colors.reset} Focus on resource field development
2. ${colors.yellow}Short-term:${colors.reset} Build troops for raiding
3. ${colors.yellow}Mid-term:${colors.reset} Prepare for second village settlement
4. ${colors.yellow}Long-term:${colors.reset} Establish resource dominance

For more specific advice, try asking about:
- Settlement timing
- Troop training priorities  
- Raiding strategies
- Building order

Type 'help' for all available commands.`;
  }

  setGameState(command) {
    const parts = command.split(' ');
    
    if (parts[1] === 'tribe' && parts[2]) {
      const validTribes = ['Roman', 'Teutonic', 'Gallic', 'Egyptian', 'Huns', 'Spartan', 'Viking'];
      const tribe = parts[2].charAt(0).toUpperCase() + parts[2].slice(1).toLowerCase();
      if (validTribes.includes(tribe)) {
        this.gameState.tribe = tribe;
        return `Tribe set to ${tribe}`;
      }
      return `Invalid tribe. Choose from: ${validTribes.join(', ')}`;
    }
    
    if (parts[1] === 'day' && parts[2]) {
      this.gameState.serverDay = parseInt(parts[2]);
      return `Server day set to ${parts[2]}`;
    }
    
    if (parts[1] === 'resources' && parts.length === 6) {
      this.gameState.villages[0].resources = {
        wood: parseInt(parts[2]),
        clay: parseInt(parts[3]),
        iron: parseInt(parts[4]),
        crop: parseInt(parts[5])
      };
      return `Resources updated`;
    }
    
    if (parts[1] === 'building' && parts[2] && parts[3]) {
      this.gameState.villages[0].buildings[parts[2]] = parseInt(parts[3]);
      return `${parts[2]} set to level ${parts[3]}`;
    }
    
    return `Invalid command. Use: set tribe/day/resources/building`;
  }
}

// Interactive CLI
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}`);
  console.log('TRAVIAN ASSISTANT V4 - LOCAL AI AGENT TEST');
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
  
  const dataProvider = new GameDataProvider();
  const aiAgent = new LocalAIAgent(dataProvider);
  
  console.log(`${colors.green}AI Agent initialized!${colors.reset}`);
  console.log(`Default: ${colors.yellow}Egyptian tribe, Day 1, Starting resources${colors.reset}`);
  console.log(`Type ${colors.cyan}'help'${colors.reset} for commands or ask any question!\n`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.bright}You: ${colors.reset}`
  });
  
  rl.prompt();
  
  rl.on('line', (line) => {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log(`${colors.yellow}Goodbye!${colors.reset}`);
      rl.close();
      return;
    }
    
    console.log('');
    
    if (input.toLowerCase().startsWith('set ')) {
      const result = aiAgent.setGameState(input);
      console.log(`${colors.cyan}System: ${result}${colors.reset}\n`);
    } else {
      const response = aiAgent.processQuestion(input);
      console.log(`${colors.bright}AI: ${colors.reset}${response}\n`);
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    process.exit(0);
  });
}

// Run the interactive test
main().catch(console.error);

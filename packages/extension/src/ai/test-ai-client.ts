// packages/extension/src/ai/test-ai-client.ts
// Test script for AI client with mock game state

import TravianAIClient from './ai-client';

// Mock game state that represents a real early-game scenario
const mockGameState = {
  villages: new Map([
    ['village_1', {
      villageName: 'Capital',
      villageId: 'village_1',
      coordinates: { x: 50, y: -25 },
      population: 156,
      resources: {
        wood: 450,
        clay: 380,
        iron: 290,
        crop: 620
      },
      storage: {
        warehouse: 2400,
        granary: 2400
      },
      production: {
        wood: 30,
        clay: 36,
        iron: 25,
        crop: 58
      },
      buildings: {
        woodcutter: [2, 3, 1, 2],
        clayPit: [3, 2, 3, 1],
        ironMine: [1, 2, 1, 1],
        cropland: [2, 2, 3, 3, 2, 1],
        mainBuilding: 3,
        warehouse: 2,
        granary: 3,
        marketplace: 0,
        barracks: 1
      },
      troops: {
        own: {
          'Slave Militia': 5,
          'Ash Warden': 2
        },
        reinforcements: {}
      },
      buildQueue: [
        { building: 'Clay Pit', level: 4, timeRemaining: 1820 }
      ],
      movements: []
    }]
  ]),
  currentVillageId: 'village_1',
  serverAge: 345600, // 4 days
  playerRank: 487,
  playerName: 'DougElite',
  tribe: 'egyptians',
  allianceData: {
    name: 'TBD',
    rank: 23,
    members: 8
  },
  recentEvents: [
    { type: 'build_complete', building: 'Main Building', level: 3, timestamp: Date.now() - 3600000 },
    { type: 'troops_trained', unit: 'Slave Militia', count: 5, timestamp: Date.now() - 7200000 },
    { type: 'incoming_attack', attacker: 'Player123', arrival: Date.now() + 14400000, timestamp: Date.now() - 1800000 }
  ],
  timestamp: Date.now()
};

// Test scenarios
const testScenarios = [
  {
    name: 'Daily Strategic Review',
    decisionType: 'daily_review',
    description: 'Standard daily analysis for strategic planning'
  },
  {
    name: 'Under Attack Response',
    decisionType: 'under_attack',
    description: 'Response to incoming attack in 4 hours'
  },
  {
    name: 'Settlement Decision',
    decisionType: 'settlement',
    description: 'Analyzing whether to rush settlers or build military'
  },
  {
    name: 'Resource Crisis',
    decisionType: 'resource_crisis',
    description: 'Low on iron, affecting troop production'
  }
];

async function testAIClient() {
  console.log('🎮 Testing Travian AI Client with Elite Instructions\n');
  console.log('=' .repeat(60));
  
  // Initialize client
  const client = new TravianAIClient();
  
  // Test each scenario
  for (const scenario of testScenarios) {
    console.log(`\n📊 Test: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log('-'.repeat(40));
    
    try {
      console.log('⏳ Analyzing game state...');
      const response = await client.analyzeGameState(
        mockGameState,
        scenario.decisionType
      );
      
      console.log('\n✅ Analysis Complete:');
      console.log(`Confidence: ${(response.confidence * 100).toFixed(0)}%\n`);
      
      // Display recommendations
      console.log('🎯 Strategic Recommendations:');
      response.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`   Why: ${rec.reason}`);
        if (rec.timing) console.log(`   When: ${rec.timing}`);
        if (rec.alternativeIf) console.log(`   Unless: ${rec.alternativeIf}`);
      });
      
      // Display insights
      if (response.insights && response.insights.length > 0) {
        console.log('\n💡 Elite Insights:');
        response.insights.forEach(insight => {
          console.log(`   • ${insight}`);
        });
      }
      
      // Display warnings
      if (response.warnings && response.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        response.warnings.forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
      
    } catch (error) {
      console.log(`\n❌ Test failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test free-form question
  console.log('\n💬 Testing Free-Form Question:');
  console.log('Question: "Should I build a second village or focus on military given that Player123 is attacking me regularly?"');
  console.log('-'.repeat(40));
  
  try {
    const answer = await client.askQuestion(
      "Should I build a second village or focus on military given that Player123 is attacking me regularly? They seem to be a much stronger player.",
      mockGameState
    );
    console.log('\n🎓 Expert Analysis:');
    console.log(answer);
  } catch (error) {
    console.log(`\n❌ Question failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ All tests complete!');
}

// Execute tests if run directly
if (require.main === module) {
  testAIClient().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testAIClient, mockGameState };
#!/usr/bin/env node
// test-ai-prompts.js
// Simple test script to verify AI integration with Claude
// Run with: node test-ai-prompts.js

const https = require('https');

// Configuration
const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

// Elite system instructions (shortened for testing)
const SYSTEM_INSTRUCTIONS = `You are an elite Travian Legends strategist, equivalent to a top-20 player.
Focus on non-obvious insights, psychological warfare, and competitive advantage.
Consider server politics, timing, and what opponents expect vs what would surprise them.`;

// Test game state
const testGameState = {
  serverDay: 4,
  playerRank: 487,
  currentVillage: {
    name: 'Capital',
    population: 156,
    resources: { wood: 450, clay: 380, iron: 290, crop: 620 },
    production: { wood: 30, clay: 36, iron: 25, crop: 58 }
  },
  recentEvents: [
    { type: 'incoming_attack', attacker: 'Player123', arrival: 'in 4 hours' }
  ]
};

// Test prompt
const testPrompt = `
Analyze this early game state and provide strategic recommendations.
Focus on non-obvious moves that would surprise opponents.

Game State:
${JSON.stringify(testGameState, null, 2)}

Provide exactly 3 recommendations in JSON format:
{
  "recommendations": [
    {
      "action": "Specific action",
      "reason": "Strategic reasoning",
      "priority": "high/medium/low"
    }
  ],
  "insight": "One key insight about the current situation"
}`;

// Function to call the proxy
async function callProxy(systemMessage, userMessage) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      system: systemMessage,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    const url = new URL(PROXY_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(parsed);
          } else {
            reject(new Error(`API error ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Main test function
async function runTest() {
  console.log('🎮 Travian Assistant AI Test');
  console.log('=' .repeat(60));
  console.log('\n📊 Test Configuration:');
  console.log(`Proxy URL: ${PROXY_URL}`);
  console.log(`Model: Claude 3.5 Sonnet`);
  console.log(`Game State: Day ${testGameState.serverDay}, Rank #${testGameState.playerRank}`);
  console.log(`Scenario: Under attack, early game resource management\n`);
  console.log('=' .repeat(60));

  try {
    console.log('\n⏳ Calling AI for strategic analysis...\n');
    
    const response = await callProxy(SYSTEM_INSTRUCTIONS, testPrompt);
    
    if (response.content && response.content[0] && response.content[0].text) {
      const aiResponse = response.content[0].text;
      console.log('✅ AI Response Received:\n');
      console.log('-'.repeat(60));
      console.log(aiResponse);
      console.log('-'.repeat(60));
      
      // Try to parse JSON from response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('\n🎯 Parsed Recommendations:\n');
          
          if (parsed.recommendations) {
            parsed.recommendations.forEach((rec, i) => {
              console.log(`${i + 1}. [${rec.priority?.toUpperCase() || 'MEDIUM'}] ${rec.action}`);
              console.log(`   Reason: ${rec.reason}\n`);
            });
          }
          
          if (parsed.insight) {
            console.log(`💡 Key Insight: ${parsed.insight}\n`);
          }
        }
      } catch (parseError) {
        console.log('⚠️  Could not parse JSON from response (this is OK for testing)');
      }
      
      console.log('\n✨ Test completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Pull latest code in Replit: git pull origin main');
      console.log('2. Install/reload Chrome extension');
      console.log('3. Test with real game state from Travian');
      console.log('4. Monitor console for AI recommendations');
      
    } else {
      console.error('❌ Unexpected response format:', response);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if Vercel proxy is deployed and running');
    console.log('2. Verify ANTHROPIC_API_KEY is set in Vercel environment');
    console.log('3. Check Vercel logs for detailed error messages');
    console.log('4. Try the proxy URL directly in browser (should show method not allowed)');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
console.log('Starting Travian AI test...\n');
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
#!/usr/bin/env node
// test-chat-ai.js
// Test the chat-based AI with natural conversation
// Run with: node test-chat-ai.js

const https = require('https');

const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

// Flexible system message that can be edited
const SYSTEM_MESSAGE = `You are an elite Travian Legends strategist, equivalent to a top-20 player.
Focus on non-obvious insights, psychological warfare, and competitive advantage.
Consider server politics, timing, and what opponents expect vs what would surprise them.
Provide conversational, thoughtful analysis without rigid structure.`;

// Natural chat message (not structured)
const chatMessage = `I'm on day 4, rank 487. Player123 is attacking me in 4 hours. 
My resources are low: 450 wood, 380 clay, 290 iron, 620 crop.
What's a non-obvious strategy here? Don't just tell me to defend or dodge.`;

async function testChat() {
  console.log('🎮 Travian Chat AI Test');
  console.log('=' .repeat(60));
  console.log('\n💬 Natural Chat Test');
  console.log('System: Elite strategist with editable instructions');
  console.log('Format: Natural conversation, no JSON required\n');
  console.log('=' .repeat(60));
  
  console.log('\n📝 User Message:');
  console.log(chatMessage);
  console.log('\n⏳ Getting AI response...\n');

  try {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_MESSAGE,
      messages: [
        { role: 'user', content: chatMessage }
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

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`Failed to parse: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    if (response.content && response.content[0] && response.content[0].text) {
      console.log('🎯 AI Strategic Response:');
      console.log('-'.repeat(60));
      console.log(response.content[0].text);
      console.log('-'.repeat(60));
      
      console.log('\n✅ Key Observations:');
      console.log('• Natural conversation flow - no JSON structure');
      console.log('• Strategic depth beyond obvious moves');
      console.log('• Psychological and timing considerations');
      console.log('• Editable system message for game phases');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Install Chrome extension');
      console.log('2. Open Travian game');
      console.log('3. Click chat button (💬)');
      console.log('4. Have natural strategy conversation');
      console.log('5. Edit system message in settings as needed');
      
    } else {
      console.error('❌ Unexpected response format:', response);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testChat().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
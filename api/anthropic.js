// Vercel Edge Function with mem0 Integration
export default async function handler(request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    // Get request body with full context
    const body = await request.json();
    const { userId, message, gameState, gameMechanics, conversationId } = body;
    
    console.log('[Vercel] Processing request for user:', userId?.substring(0, 10));
    
    // Step 1: Retrieve memories from mem0 if configured
    let memories = [];
    let memoryContext = '';
    const MEM0_API_KEY = process.env.MEM0_API_KEY;
    
    if (MEM0_API_KEY && userId) {
      try {
        console.log('[Vercel] Retrieving mem0 memories...');
        const mem0Response = await fetch(`https://api.mem0.ai/v1/memories/?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${MEM0_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (mem0Response.ok) {
          const mem0Data = await mem0Response.json();
          memories = mem0Data.memories || [];
          console.log(`[Vercel] Retrieved ${memories.length} memories from mem0`);
          
          if (memories.length > 0) {
            memoryContext = '\n## Your Previous Context:\n' + 
              memories.map(m => `- ${m.memory}`).join('\n');
          }
        }
      } catch (mem0Error) {
        console.error('[Vercel] Mem0 retrieval error:', mem0Error);
        // Continue without memories
      }
    }
    
    // Step 2: Call Replit for game context + Claude
    const replitUrl = 'https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev/api/ai-chat';
    
    // Add memory context to the message
    const enhancedMessage = memoryContext ? 
      `${message}\n\n${memoryContext}` : 
      message;
    
    console.log('[Vercel] Forwarding to Replit with enhanced context...');
    const replitResponse = await fetch(replitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message: enhancedMessage,
        gameState,
        gameMechanics,
        conversationId
      })
    });

    let claudeResponse;
    if (!replitResponse.ok) {
      // Fallback to direct Claude if Replit fails
      console.log('[Vercel] Replit failed, using direct Claude...');
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('No Anthropic API key');
      
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: enhancedMessage }],
          system: `You are an expert Travian Legends strategic advisor.${memoryContext}`,
          temperature: 0.7,
        }),
      });
      
      claudeResponse = await anthropicResponse.json();
    } else {
      claudeResponse = await replitResponse.json();
    }
    
    // Step 3: Store new memories in mem0
    if (MEM0_API_KEY && userId && claudeResponse.content?.[0]?.text) {
      try {
        // Store user's statement if it contains preferences
        if (message.match(/prefer|like|want|strategy|always|never|my|I am|I have/i)) {
          await fetch('https://api.mem0.ai/v1/memories/', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${MEM0_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [
                { role: 'user', content: message },
                { role: 'assistant', content: claudeResponse.content[0].text }
              ],
              user_id: userId,
              metadata: {
                source: 'travian_assistant',
                conversationId,
                timestamp: new Date().toISOString()
              }
            })
          });
          console.log('[Vercel] Stored conversation in mem0');
        }
      } catch (storeError) {
        console.error('[Vercel] Mem0 storage error:', storeError);
        // Continue without storing
      }
    }
    
    // Return response with mem0 metadata
    return new Response(JSON.stringify({
      ...claudeResponse,
      mem0: {
        memories_retrieved: memories.length,
        memories_stored: true
      }
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('[Vercel] Error:', error);
    
    // Emergency fallback
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const body = await request.json().catch(() => ({ message: 'Help' }));
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: body.message || 'Help with Travian' }],
            temperature: 0.7,
          }),
        });
        
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
        });
      } catch (e) {
        console.error('[Vercel] Fallback error:', e);
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Service error', message: error.message }), 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

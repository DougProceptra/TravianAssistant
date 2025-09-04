// Vercel Edge Function - Routes through Replit for mem0 integration
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
    console.log('[Vercel] Received request with userId:', body.userId);
    
    // Route through Replit backend for mem0 integration
    const replitUrl = 'https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev/api/ai-chat';
    
    console.log('[Vercel] Forwarding to Replit for mem0 processing...');
    const replitResponse = await fetch(replitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: body.userId,
        message: body.message,
        gameState: body.gameState,
        gameMechanics: body.gameMechanics,
        conversationId: body.conversationId
      })
    });

    if (!replitResponse.ok) {
      // If Replit fails, fall back to direct Anthropic API
      console.log('[Vercel] Replit failed, falling back to direct Anthropic...');
      
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Configuration error' }), 
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            }
          }
        );
      }
      
      // Build context-aware message
      const systemMessage = `You are an expert Travian Legends strategic advisor with memory of past conversations.
      
User Context:
- UserId: ${body.userId || 'anonymous'}
- Game State: ${JSON.stringify(body.gameState || {})}
- Current Resources: ${JSON.stringify(body.gameState?.resources || {})}
- Culture Points: ${body.gameState?.culturePoints?.current || 0}/${body.gameState?.culturePoints?.needed || 'unknown'}

Provide strategic advice specific to Travian Legends gameplay.`;
      
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
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: body.message }
          ],
          temperature: 0.7,
        }),
      });

      const data = await anthropicResponse.json();
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }
    
    // Return Replit response (which includes mem0-enhanced Claude response)
    const data = await replitResponse.json();
    console.log('[Vercel] Successfully received mem0-enhanced response from Replit');
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('[Vercel] Proxy error:', error);
    
    // Last resort fallback - basic Claude response
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const body = await request.json().catch(() => ({ message: 'Error parsing request' }));
        
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: body.message || 'Help with Travian strategy' }],
            temperature: 0.7,
          }),
        });
        
        const data = await anthropicResponse.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
        });
      } catch (fallbackError) {
        console.error('[Vercel] Fallback also failed:', fallbackError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Service error', 
        message: 'Unable to process request. Please try again.',
        details: error.message 
      }), 
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

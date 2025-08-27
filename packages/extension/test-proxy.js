// Test if the Vercel proxy is accessible
const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

async function testProxy() {
  try {
    console.log('Testing proxy connection...');
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        temperature: 0.7,
        system: 'You are a test.',
        messages: [
          { role: 'user', content: 'Reply with just: PROXY WORKING' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Proxy response:', data.content?.[0]?.text || 'No text in response');
    } else {
      console.log('❌ Proxy error:', response.status, response.statusText);
      const text = await response.text();
      console.log('Error body:', text);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testProxy();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;

// Simple in-memory storage
const items = [];

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
    return;
  }

  if (path === '/api/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      status: 'success',
      version: '1.0.0'
    }));
    return;
  }

  if (path === '/api/items' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: items,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (path === '/api/items' && method === 'POST') {
    const body = await parseBody(req);
    const { title, description } = body;
    
    if (!title) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'error',
        message: 'Title is required',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      createdAt: new Date()
    };

    items.push(newItem);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: newItem,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve HTML file for all other routes
  try {
    const htmlPath = __dirname + '/dist/public/index.html';
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/health');
  console.log('  GET /api/hello');
  console.log('  GET /api/items');
  console.log('  POST /api/items');
  console.log('  GET / (React app)');
});
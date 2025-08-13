const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
const items = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello World!',
    timestamp: new Date().toISOString(),
    status: 'success',
    version: '1.0.0'
  });
});

app.get('/api/items', (req, res) => {
  res.json({
    status: 'success',
    data: items,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/items', (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({
      status: 'error',
      message: 'Title is required',
      timestamp: new Date().toISOString()
    });
  }

  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    description,
    createdAt: new Date()
  };

  items.push(newItem);
  
  res.json({
    status: 'success',
    data: newItem,
    timestamp: new Date().toISOString()
  });
});

// Serve HTML for root path
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'dist/public/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading app');
  }
});

// Handle all other routes
app.get('*', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'dist/public/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.send(html);
  } catch (error) {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/health');
  console.log('  GET /api/hello');
  console.log('  GET /api/items');
  console.log('  POST /api/items');
  console.log('  GET / (React app)');
});
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting server and waiting for it to be ready...\n');

// Start the server
const server = spawn('node', ['server-sqlite.js'], {
  stdio: 'inherit',
  env: { ...process.env, USE_SQLITE: 'true' }
});

// Wait a moment for server to start
setTimeout(() => {
  // Test if server is running
  const req = http.get('http://localhost:3001/api/health', (res) => {
    if (res.statusCode === 200) {
      console.log('\n✅ Server is running successfully!');
      console.log('🌐 Access URLs:');
      console.log('   API: http://localhost:3001');
      console.log('   Health: http://localhost:3001/api/health');
      console.log('   WebSocket: ws://localhost:3001');
      console.log('\n📝 Next steps:');
      console.log('1. Open a new Shell tab');
      console.log('2. Run: node scripts/test-backend-sqlite.js');
      console.log('3. Check the test results');
      console.log('\nPress Ctrl+C to stop the server');
    }
  });
  
  req.on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    server.kill();
    process.exit(1);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});

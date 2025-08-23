# TravianAssistant V3 Scripts

## Day 1 Implementation Scripts

### 1. Initialize Database
```bash
node scripts/init-db-v3.js
```
Creates all V3 tables with proper schema for game start optimization and AI recommendations.

### 2. Import Map Data
```bash
node scripts/import-map.js
```
Downloads and imports the latest map.sql from your Travian server.

## Quick Start Commands for Replit

Run these in order:

```bash
# 1. Pull latest code from GitHub
git pull origin main

# 2. Install dependencies (if needed)
cd backend && npm install && cd ..

# 3. Initialize V3 database
node scripts/init-db-v3.js

# 4. Import map data
node scripts/import-map.js

# 5. Start the server
cd backend && npm start
```

## Environment Variables

Make sure your `.env` file in backend folder has:
```
SERVER_URL=https://lusobr.x2.lusobrasileiro.travian.com
ANTHROPIC_API_KEY=your_key_here
```

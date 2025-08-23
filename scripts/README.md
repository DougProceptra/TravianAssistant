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

### 3. Test Database
```bash
node scripts/test-db.js
```
Verifies database setup and shows statistics.

## Quick Start Commands for Replit

Run these in order:

```bash
# 1. Pull latest code from GitHub
git pull origin main

# 2. Install dependencies (if needed)
cd backend && npm install @anthropic-ai/sdk && cd ..

# 3. Initialize V3 database
node scripts/init-db-v3.js

# 4. Import map data
node scripts/import-map.js

# 5. Test the database
node scripts/test-db.js

# 6. Start the server
cd backend && npm start
```

## Replit Secrets Configuration

Use the Secrets tab (🔐) in Replit to set these environment variables:

### Required Secrets
```
ANTHROPIC_API_KEY = [your API key]
TRAVIAN_SERVER_URL = https://lusobr.x2.lusobrasileiro.travian.com
```

### Optional Secrets
```
DATABASE_PATH = ./backend/travian.db
TRAVIAN_SERVER_SPEED = 2
```

### Naming Convention for Multiple Servers
If you play on multiple servers, you can add more specific secrets:
```
TRAVIAN_SERVER_URL_LUSOBR = https://lusobr.x2.lusobrasileiro.travian.com
TRAVIAN_SERVER_URL_COM5 = https://ts5.x1.international.travian.com
TRAVIAN_SERVER_URL_TEST = https://test.x3.travian.com
```

Then modify the import script to use a specific server when needed.

## Important Notes
- **NO .env files needed** - Replit Secrets are automatically available as environment variables
- Scripts will check for `TRAVIAN_SERVER_URL` first, then fall back to default
- Database is stored at `backend/travian.db`

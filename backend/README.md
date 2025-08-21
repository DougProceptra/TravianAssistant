# TravianAssistant Backend

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start
```

## API Endpoints

### Account Management
- `POST /api/account` - Create/update account
- `GET /api/account/:accountId` - Get account overview

### Data Sync
- `POST /api/sync` - Sync game state from extension
- `GET /api/history/:villageId?hours=24` - Get historical data

### Alerts
- `PATCH /api/alert/:alertId/resolve` - Mark alert as resolved

## WebSocket Events

- `register` - Register account for real-time updates
- `data_synced` - Broadcast when new data arrives
- `alert` - Real-time alert notifications

## Database Schema

SQLite database with tables:
- `accounts` - Game accounts
- `villages` - Villages in each account
- `village_snapshots` - Historical village data
- `alerts` - Generated alerts

## Data Flow

1. Extension scrapes game data
2. Sends to `/api/sync` endpoint
3. Backend stores in SQLite
4. Checks for alerts (overflow, starvation)
5. Broadcasts updates via WebSocket
6. Extension displays alerts in HUD
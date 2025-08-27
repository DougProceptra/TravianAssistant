-- TravianAssistant V3 Database Schema
-- SQLite3 compatible

-- Drop existing tables for clean setup
DROP TABLE IF EXISTS villages;
DROP TABLE IF EXISTS game_events;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS performance_metrics;
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS player_snapshots;

-- Villages from map.sql (x_world table)
CREATE TABLE villages (
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  tid INTEGER,
  vid INTEGER UNIQUE,
  village TEXT,
  uid INTEGER,
  player TEXT,
  aid INTEGER,
  alliance TEXT,
  population INTEGER,
  data JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Create indexes for common queries
CREATE INDEX idx_villages_coords ON villages(x, y);
CREATE INDEX idx_villages_player ON villages(uid);
CREATE INDEX idx_villages_alliance ON villages(aid);
CREATE INDEX idx_villages_population ON villages(population DESC);

-- Game events tracking
CREATE TABLE game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  village_id INTEGER,
  data JSON NOT NULL,
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_events_timestamp ON game_events(timestamp DESC);
CREATE INDEX idx_events_type ON game_events(event_type);
CREATE INDEX idx_events_processed ON game_events(processed);

-- AI recommendations
CREATE TABLE recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority INTEGER NOT NULL DEFAULT 5,
  action_type TEXT NOT NULL,
  action_data JSON,
  reasoning TEXT,
  completed BOOLEAN DEFAULT FALSE,
  result JSON,
  village_id INTEGER
);

CREATE INDEX idx_recommendations_priority ON recommendations(priority DESC, timestamp DESC);
CREATE INDEX idx_recommendations_completed ON recommendations(completed);

-- Performance tracking
CREATE TABLE performance_metrics (
  date DATE PRIMARY KEY,
  population_rank INTEGER,
  alliance_rank INTEGER,
  offensive_rank INTEGER,
  defensive_rank INTEGER,
  resource_production INTEGER,
  time_played_minutes INTEGER,
  actions_automated INTEGER,
  villages_count INTEGER,
  troops_count INTEGER,
  data JSON
);

-- Chat history with AI
CREATE TABLE chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  game_state JSON,
  tokens_used INTEGER,
  session_id TEXT
);

CREATE INDEX idx_chat_timestamp ON chat_history(timestamp DESC);
CREATE INDEX idx_chat_session ON chat_history(session_id);

-- Player state snapshots
CREATE TABLE player_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  villages JSON NOT NULL,
  resources JSON,
  troops JSON,
  buildings JSON,
  research JSON,
  hero JSON,
  data JSON
);

CREATE INDEX idx_snapshots_timestamp ON player_snapshots(timestamp DESC);

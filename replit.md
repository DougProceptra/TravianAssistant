# TravianAssistant - AI-Powered Travian Strategy Extension

## Overview

TravianAssistant is a Chrome extension that serves as an AI-powered strategic advisor for the Travian Legends browser game. The core philosophy is that "The AI agent IS the product" - everything else is just infrastructure to feed game data to Claude AI for strategic analysis. This is not a HUD or automation tool, but rather a conversational AI that understands your current game state and provides strategic recommendations through a simple chat interface.

The system scrapes real-time game data from Travian pages and combines it with comprehensive game mechanics data to provide contextual strategic advice. The extension operates as a content script that collects village information, resources, production rates, and building data, then sends this context to Claude AI for intelligent analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (Chrome Extension)
- **Manifest V3 Extension** - Uses modern Chrome extension standards with service workers
- **Content Script Architecture** - Scripts injected into Travian pages to collect game data
- **Chat Interface** - Draggable and resizable chat window overlay on game pages
- **No Complex UI** - Deliberately minimal interface with chat as the primary interaction method

### Data Collection Pipeline
- **Overview Parser** - Extracts village information from the overview page
- **Safe Scraper** - Collects current village data including resources and production
- **Script Injection** - Accesses window.resources object for real-time game state
- **Local Storage Persistence** - RBP-style data caching for performance

### AI Integration Layer
- **Claude Sonnet Integration** - Uses Claude-3.5-Sonnet-20241022 model for strategic analysis
- **Context Intelligence** - Planned integration with learning system for improved recommendations
- **Message Processing** - Background service worker handles API communication
- **Game Context Injection** - Raw game data included with every AI query for contextual responses

### Data Architecture
- **SQLite Backend** - Optional backend server for map data and game mechanics
- **Game Mechanics Database** - Complete building costs, troop stats, and formulas from Kirilloid
- **Local Calculation Engine** - Extension performs calculations locally for instant responses

### Build System
- **esbuild Pipeline** - Fast bundling for development iterations
- **Version Management** - Automated version tracking across components
- **Minimal Build Script** - Simplified build process for reliable deployment

## External Dependencies

### AI Services
- **Anthropic Claude API** - Primary AI model for strategic recommendations
- **Vercel Edge Functions** - API proxy for CORS compliance and rate limiting
- **Context Intelligence Service** - Learning system at proceptra.app.n8n.cloud

### Game Data Sources
- **Kirilloid Repository** - Authoritative source for Travian game mechanics and calculations
- **Travian Map Data** - Server-specific map.sql files for village and alliance information
- **ResourceBarPlus Integration** - Compatibility with existing Travian userscripts

### Development Infrastructure
- **GitHub Repository** - Source code management and version control
- **Replit Environment** - Development and testing environment
- **Better-SQLite3** - High-performance SQLite implementation for Node.js
- **Express.js** - Backend API server for data management

### Browser APIs
- **Chrome Extension APIs** - For content script injection and messaging
- **Local Storage API** - For persistent data caching
- **DOM Manipulation** - For game data extraction and UI injection

### Build Dependencies
- **esbuild** - Fast JavaScript bundler and compiler
- **TypeScript** - Type-safe development environment
- **Node.js Runtime** - Development tooling and backend services
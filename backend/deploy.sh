#!/bin/bash
# Deployment script for TravianAssistant Backend

echo "🚀 TravianAssistant Backend Deployment Script"
echo "============================================"

# Pull latest changes from Git
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration"
fi

# Run the server
echo "🚀 Starting server..."
node server.js
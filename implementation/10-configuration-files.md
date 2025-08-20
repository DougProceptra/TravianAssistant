# Configuration Files

## File: `package.json`

```json
{
  "name": "travian-ai-assistant",
  "version": "1.0.0",
  "description": "AI-powered assistant for Travian Legends",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.251",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-web-extension": "^3.2.0"
  }
}
```

## File: `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Travian AI Assistant",
  "version": "1.0.0",
  "description": "AI-powered strategic assistant for Travian Legends",
  "permissions": [
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "*://*.travian.com/*"
  ],
  "background": {
    "service_worker": "dist/background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://*.travian.com/*"],
      "js": ["dist/content.js"],
      "run_at": "document_idle"
    }
  ],
  "options_page": "dist/options.html",
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["chrome", "vite/client"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## File: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
  },
});
```

## File: `.env.example`

```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: Development Settings
DEV_MODE=true
DEBUG_LEVEL=info
```

## File: `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Temporary files
*.tmp
*.temp
```

## File: `README.md`

```markdown
# Travian AI Assistant

AI-powered strategic assistant for Travian Legends using Claude API.

## Features

- 🤖 Intelligent game analysis powered by Claude AI
- 📊 Real-time resource management and overflow prevention
- ⚔️ Military strategy recommendations
- 🏗️ Optimized building queue suggestions
- 👥 Multiple player profiles for different strategies
- 🔄 Profile sharing with alliance members
- 💬 Natural language Q&A about game strategy

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DougProceptra/TravianAssistant.git
   cd TravianAssistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Add your Claude API key to .env
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Configuration

1. Click the extension icon or go to extension options
2. Enter your Claude API key from [Anthropic Console](https://console.anthropic.com)
3. Create your player profile (tribe, style, goals)
4. Navigate to any Travian game page
5. The AI HUD will appear automatically

## Usage

The assistant provides:
- **Automatic Analysis**: Game state analyzed every 60 seconds
- **Smart Recommendations**: Prioritized actions based on your profile
- **Natural Chat**: Ask questions about strategy
- **Quick Actions**: Common questions with one-click access

## Cost

- Claude Haiku API: ~$0.01-0.02 per analysis
- Average usage: ~$0.30/day or ~$30 for a full server

## Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

## License

MIT
```

## Scripts

### File: `scripts/build.sh`

```bash
#!/bin/bash

# Build script for Travian AI Assistant

echo "Building Travian AI Assistant..."

# Clean previous build
rm -rf dist/

# Install dependencies
npm install

# Run type checking
npm run type-check

# Build extension
npm run build

# Create icons directory
mkdir -p dist/icons

# Copy manifest
cp manifest.json dist/

# Copy icons (you'll need to add these)
cp icons/*.png dist/icons/ 2>/dev/null || echo "Warning: No icons found"

echo "Build complete! Extension ready in dist/ folder"
```

### File: `scripts/package.sh`

```bash
#!/bin/bash

# Package extension for distribution

./scripts/build.sh

# Create release directory
mkdir -p releases

# Get version from manifest
VERSION=$(grep '"version"' manifest.json | cut -d '"' -f 4)

# Create ZIP file
cd dist
zip -r ../releases/travian-ai-assistant-v${VERSION}.zip *
cd ..

echo "Extension packaged: releases/travian-ai-assistant-v${VERSION}.zip"
```

## Testing Files

### File: `test/mock-game-state.json`

```json
{
  "timestamp": 1704212400000,
  "serverDay": 15,
  "serverTime": "14:30:00",
  "villages": [
    {
      "id": "village-1",
      "name": "Capital",
      "coordinates": { "x": 0, "y": 0 },
      "isCapital": true,
      "population": 523,
      "loyalty": 100
    }
  ],
  "resources": {
    "wood": 8500,
    "clay": 7200,
    "iron": 6800,
    "crop": 9200
  },
  "production": {
    "wood": 420,
    "clay": 380,
    "iron": 350,
    "crop": 450,
    "cropNet": 380
  },
  "capacity": {
    "warehouse": 10000,
    "granary": 10000
  },
  "buildQueue": [
    {
      "id": "build-1",
      "name": "Woodcutter",
      "level": 7,
      "timeLeft": "0:45:32",
      "finishTime": "2024-01-02T15:15:32.000Z"
    }
  ],
  "troops": {
    "own": {
      "u1": 50,
      "u2": 30
    },
    "reinforcements": {},
    "totalDefense": 2400,
    "totalOffense": 1600,
    "inTraining": []
  },
  "movements": [],
  "incomingAttacks": [],
  "hero": {
    "level": 5,
    "health": 100,
    "experience": 2500,
    "adventurePoints": 3,
    "location": "home",
    "status": "home"
  },
  "reports": []
}
```
#!/bin/bash

# Find and fix the suggestions area in conversational-ai-fixed.ts
# The suggestions are likely positioned at the bottom and need to be part of the scrollable area

# Look for the suggestions div
grep -n "tla-chat-suggestions" src/content/conversational-ai-fixed.ts

# The issue is the suggestions are outside the scrollable messages area
# They should either be:
# 1. Hidden when chat has content, or
# 2. Inside the scrollable area, or  
# 3. Removed entirely if not needed

# Let's make the chat window shorter and put suggestions in a collapsible state
sed -i 's/height: 500px;/height: 450px;/' src/content/conversational-ai-fixed.ts
sed -i 's/max-height: calc(100vh - 100px);/max-height: calc(100vh - 120px);/' src/content/conversational-ai-fixed.ts

# Make suggestions optional/collapsible
sed -i '/.tla-chat-suggestions {/,/}/ {
  s/padding: 8px;/padding: 4px;\n        max-height: 100px;\n        overflow-y: auto;\n        font-size: 11px;/
}' src/content/conversational-ai-fixed.ts

# Make suggestion items smaller
sed -i '/.tla-suggestion {/,/}/ {
  s/padding: 8px 12px;/padding: 6px 10px;\n        font-size: 12px;/
}' src/content/conversational-ai-fixed.ts

# Increment version to track this fix
sed -i 's/VERSION="0.8.[0-9]"/VERSION="0.8.9"/' build-minimal.sh
sed -i "s/VERSION = '0.8.[0-9]'/VERSION = '0.8.9'/" src/version.ts
sed -i 's/"version": "0.8.[0-9]"/"version": "0.8.9"/' manifest.json

echo "Building with suggestions fix..."

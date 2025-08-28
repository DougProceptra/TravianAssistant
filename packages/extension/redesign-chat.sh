#!/bin/bash

# Find where suggestions are added in the HTML
echo "Removing suggestions section..."

# Comment out or remove the suggestions div entirely
sed -i '/<div class="tla-chat-suggestions"/,/<\/div>/d' src/content/conversational-ai-fixed.ts

# Also remove the suggestion click handlers
sed -i '/Handle suggestion clicks/,/});/d' src/content/conversational-ai-fixed.ts

# Make the chat window resizable by adding resize handle
sed -i '/chat.id = .tla-chat-interface.;/a\
    chat.style.resize = "both";\
    chat.style.overflow = "auto";' src/content/conversational-ai-fixed.ts

# Adjust the chat window to use more space now that suggestions are gone
sed -i 's/height: 450px;/height: 480px;/' src/content/conversational-ai-fixed.ts
sed -i 's/max-height: 350px;/max-height: 400px;/' src/content/conversational-ai-fixed.ts

# Add a resize handle style
sed -i '/\.tla-chat-interface {/a\
        resize: both;\
        overflow: auto;\
        min-width: 350px;\
        min-height: 300px;\
        max-width: 600px;' src/content/conversational-ai-fixed.ts

# Version bump to track this redesign
sed -i 's/VERSION="0.8.[0-9]"/VERSION="0.9.0"/' build-minimal.sh
sed -i "s/VERSION = '0.8.[0-9]'/VERSION = '0.9.0'/" src/version.ts
sed -i 's/"version": "0.8.[0-9]"/"version": "0.9.0"/' manifest.json

echo "Chat redesigned - suggestions removed, window resizable"

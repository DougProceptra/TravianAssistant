#!/bin/bash

# Fix text wrapping in textarea
sed -i 's/<textarea id="tla-chat-input"/<textarea id="tla-chat-input" wrap="soft"/' src/content/conversational-ai-fixed.ts

# Add resize handle visibility
sed -i '/#tla-chat-interface {/,/}/ {
  /resize: both;/a\
      /* Resize handle visible */\
      &::after {\
        content: "↘";\
        position: absolute;\
        bottom: 0;\
        right: 0;\
        padding: 2px 5px;\
        color: #666;\
        pointer-events: none;\
      }
}' src/content/conversational-ai-fixed.ts

# Version 0.9.4
sed -i 's/VERSION="0.9.[0-9]"/VERSION="0.9.4"/' build-minimal.sh
sed -i "s/VERSION = '0.9.[0-9]'/VERSION = '0.9.4'/" src/version.ts
sed -i 's/"version": "0.9.[0-9]"/"version": "0.9.4"/' manifest.json

echo "Fixed final issues"

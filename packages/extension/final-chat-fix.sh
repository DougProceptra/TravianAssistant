#!/bin/bash

# Find and update the chat interface styles
sed -i '/#tla-chat-interface {/,/^      }/ {
  s/height: [0-9]*px;/height: 400px;/
  s/width: [0-9]*px;/width: 400px;/
  /max-height:/d
  /position: fixed;/a\
      resize: both;\
      overflow: hidden;\
      min-width: 350px;\
      min-height: 300px;\
      max-width: 600px;\
      max-height: 80vh;
}' src/content/conversational-ai-fixed.ts

# Fix the messages area to leave room for input
sed -i '/.tla-chat-messages {/,/^      }/ {
  s/max-height: [0-9]*px;/height: calc(100% - 120px);/
  /overflow-y: auto;/a\
      overflow-x: hidden;
}' src/content/conversational-ai-fixed.ts

# Fix input container to stay at bottom
sed -i '/.tla-chat-input-container {/,/^      }/ {
  /padding:/a\
      position: absolute;\
      bottom: 0;\
      left: 0;\
      right: 0;\
      background: rgba(20, 20, 20, 0.95);
}' src/content/conversational-ai-fixed.ts

# Version 0.9.1 for this fix
sed -i 's/VERSION="0.9.0"/VERSION="0.9.1"/' build-minimal.sh
sed -i "s/VERSION = '0.9.0'/VERSION = '0.9.1'/" src/version.ts
sed -i 's/"version": "0.9.0"/"version": "0.9.1"/' manifest.json

echo "Final chat fixes applied"

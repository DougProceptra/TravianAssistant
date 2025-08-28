#!/bin/bash

# Comment out suggestions HTML instead of deleting
sed -i 's|<div class="tla-chat-suggestions">|<!-- <div class="tla-chat-suggestions">|' src/content/conversational-ai-fixed.ts
sed -i 's|</div><!-- Suggestions end -->|</div> --><!-- Suggestions end -->|' src/content/conversational-ai-fixed.ts

# Comment out suggestion handlers
sed -i 's|// Handle suggestion clicks|/* Handle suggestion clicks|' src/content/conversational-ai-fixed.ts
sed -i '/\/\* Handle suggestion clicks/,/forEach/ {
  N
  s/\n/\n\/\//
}' src/content/conversational-ai-fixed.ts

echo "Commented out suggestions"

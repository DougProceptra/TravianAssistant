#!/bin/bash

# Remove just the suggestions HTML div
sed -i '/<div class="tla-chat-suggestions"/,/^      <\/div>/d' src/content/conversational-ai-fixed.ts

# Remove just the suggestion click handler, not the closing braces
sed -i '/\/\/ Handle suggestion clicks/,/^    });$/ {
  /\/\/ Handle suggestion clicks/d
  /suggestion.addEventListener/,/^      });$/d
}' src/content/conversational-ai-fixed.ts

# Make window resizable
sed -i '/#tla-chat-interface {/,/^      }/ {
  s/height: 550px;/height: 480px;\n      resize: both;\n      min-width: 350px;\n      min-height: 300px;\n      max-width: 600px;/
}' src/content/conversational-ai-fixed.ts

echo "Fixed properly"

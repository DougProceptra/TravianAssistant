#!/bin/bash

# Just fix text wrapping - this is simple and should work
sed -i 's/<textarea id="tla-chat-input"/<textarea id="tla-chat-input" wrap="soft"/' src/content/conversational-ai-fixed.ts

# Make header cursor show it's draggable
sed -i '/.tla-chat-header {/,/}/ {
  /padding:/a\
      cursor: move;
}' src/content/conversational-ai-fixed.ts

echo "Applied simple fixes"

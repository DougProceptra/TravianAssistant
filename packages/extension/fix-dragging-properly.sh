#!/bin/bash

# The dragging code is there but not connected properly
# Find where the variables are declared and make them class properties

# First, check if dragging variables are scoped correctly
echo "Checking drag implementation..."

# Make dragging work by ensuring variables are in the right scope
# The issue is isDragging is declared twice - once globally, once locally

# Remove the duplicate declaration
sed -i '/let isDragging = false;/,/let chatStartY = 0;/ {
  /chatButton.addEventListener/!d
}' src/content/conversational-ai-fixed.ts

# Ensure the header drag handler can access the variables
sed -i '/const header = this.chatInterface/,/});$/ {
  s/isDragging/this.isDragging/g
  s/dragStartX/this.dragStartX/g
  s/dragStartY/this.dragStartY/g
  s/chatStartX/this.chatStartX/g
  s/chatStartY/this.chatStartY/g
}' src/content/conversational-ai-fixed.ts

# Add class properties for dragging
sed -i '/class ConversationalAI {/a\
  private isDragging = false;\
  private dragStartX = 0;\
  private dragStartY = 0;\
  private chatStartX = 0;\
  private chatStartY = 0;' src/content/conversational-ai-fixed.ts

echo "Dragging should work now"

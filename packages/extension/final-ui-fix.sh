#!/bin/bash

# 1. Fix text wrapping - add the attribute directly in the HTML template
sed -i 's/<textarea id="tla-chat-input"/<textarea id="tla-chat-input" wrap="soft" style="word-wrap: break-word;"/' src/content/conversational-ai-fixed.ts

# 2. Make resize handle visible with inline CSS
sed -i '/#tla-chat-interface {/,/}/ {
  s/resize: both;/resize: both;\n      overflow: auto;/
}' src/content/conversational-ai-fixed.ts

# 3. Fix dragging by making it simpler - just make the whole header draggable
sed -i '/class ConversationalAI {/a\
  private dragOffset = { x: 0, y: 0 };' src/content/conversational-ai-fixed.ts

# Add a simple drag implementation after the chat is created
sed -i '/this.chatInterface = this.createChatInterface();/a\
    this.makeDraggable();' src/content/conversational-ai-fixed.ts

# Add the makeDraggable method before the last closing brace
sed -i '/^}$/i\
  private makeDraggable() {\
    const header = this.chatInterface?.querySelector(".tla-chat-header") as HTMLElement;\
    if (!header) return;\
    \
    header.style.cursor = "move";\
    let isDragging = false;\
    let startX = 0, startY = 0;\
    \
    header.onmousedown = (e) => {\
      isDragging = true;\
      startX = e.clientX - this.chatInterface!.offsetLeft;\
      startY = e.clientY - this.chatInterface!.offsetTop;\
    };\
    \
    document.onmousemove = (e) => {\
      if (!isDragging) return;\
      this.chatInterface!.style.left = (e.clientX - startX) + "px";\
      this.chatInterface!.style.top = (e.clientY - startY) + "px";\
      this.chatInterface!.style.right = "auto";\
      this.chatInterface!.style.bottom = "auto";\
    };\
    \
    document.onmouseup = () => {\
      isDragging = false;\
    };\
  }' src/content/conversational-ai-fixed.ts

# Version 0.9.5
sed -i 's/VERSION="0.9.4"/VERSION="0.9.5"/' build-minimal.sh
sed -i "s/VERSION = '0.9.4'/VERSION = '0.9.5'/" src/version.ts
sed -i 's/"version": "0.9.4"/"version": "0.9.5"/' manifest.json

echo "UI fixes applied - v0.9.5"

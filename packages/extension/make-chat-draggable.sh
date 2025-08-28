#!/bin/bash

# Add draggable functionality to the chat header
sed -i '/<div class="tla-chat-header">/a\
        <span class="tla-chat-drag-handle" title="Drag to move">☰</span>' src/content/conversational-ai-fixed.ts

# Add drag handle styles
sed -i '/.tla-chat-header {/,/^      }/ {
  /padding:/a\
      cursor: move;\
      user-select: none;
}' src/content/conversational-ai-fixed.ts

# Add the drag functionality in the initialization
sed -i '/chat.innerHTML = `/i\
    // Make chat draggable\
    let isDragging = false;\
    let dragStartX = 0;\
    let dragStartY = 0;\
    let chatStartX = 0;\
    let chatStartY = 0;\
' src/content/conversational-ai-fixed.ts

# Add event listeners for dragging after the chat is created
sed -i '/document.body.appendChild(this.chatInterface);/a\
    \
    // Add drag functionality\
    const header = this.chatInterface.querySelector(".tla-chat-header") as HTMLElement;\
    if (header) {\
      header.addEventListener("mousedown", (e) => {\
        isDragging = true;\
        dragStartX = e.clientX;\
        dragStartY = e.clientY;\
        const rect = this.chatInterface!.getBoundingClientRect();\
        chatStartX = rect.left;\
        chatStartY = rect.top;\
        e.preventDefault();\
      });\
      \
      document.addEventListener("mousemove", (e) => {\
        if (!isDragging) return;\
        const deltaX = e.clientX - dragStartX;\
        const deltaY = e.clientY - dragStartY;\
        this.chatInterface!.style.left = (chatStartX + deltaX) + "px";\
        this.chatInterface!.style.top = (chatStartY + deltaY) + "px";\
        this.chatInterface!.style.right = "auto";\
        this.chatInterface!.style.bottom = "auto";\
      });\
      \
      document.addEventListener("mouseup", () => {\
        isDragging = false;\
      });\
    }' src/content/conversational-ai-fixed.ts

# Version 0.9.3
sed -i 's/VERSION="0.9.[0-9]"/VERSION="0.9.3"/' build-minimal.sh
sed -i "s/VERSION = '0.9.[0-9]'/VERSION = '0.9.3'/" src/version.ts
sed -i 's/"version": "0.9.[0-9]"/"version": "0.9.3"/' manifest.json

echo "Chat is now draggable"

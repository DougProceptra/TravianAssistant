#!/bin/bash
# Fix the villages Map/Array mismatch in ai-chat-client.ts

# Replace line 161 which has the .get() call
sed -i '161s/.*/    const village = gameState.villages?.find(v => v.id === gameState.currentVillageId);/' src/ai/ai-chat-client.ts

echo "Fixed line 161"

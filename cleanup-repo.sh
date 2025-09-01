#!/bin/bash
# TravianAssistant Repository Cleanup Script
# Execute to archive old files and clean up structure

echo "Starting TravianAssistant cleanup..."

# Create archive directories
mkdir -p docs/archive
mkdir -p archive/old-implementations
mkdir -p archive/old-scripts

# Archive outdated documentation
echo "Archiving old documentation..."
[ -f "docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md" ] && git mv docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md docs/archive/
[ -f "docs/OPTIMIZER_NOT_DEPLOYED.md" ] && git mv docs/OPTIMIZER_NOT_DEPLOYED.md docs/archive/
[ -f "docs/work-plan-v2.md" ] && git mv docs/work-plan-v2.md docs/archive/
[ -f "docs/AI_SETTLEMENT_LOGIC.md" ] && git mv docs/AI_SETTLEMENT_LOGIC.md docs/archive/
[ -f "docs/kirilloid-data-structure.md" ] && git mv docs/kirilloid-data-structure.md docs/archive/

# Archive old implementations
echo "Archiving old code..."
[ -d "calculation-engine" ] && git mv calculation-engine archive/old-implementations/
[ -f "server/ai-service.js" ] && git mv server/ai-service.js archive/old-implementations/

# Archive old extension files that were never integrated
[ -f "packages/extension/src/game-start-optimizer.ts" ] && git mv packages/extension/src/game-start-optimizer.ts archive/old-implementations/
[ -f "packages/extension/src/ai-prompt-enhancer.ts" ] && git mv packages/extension/src/ai-prompt-enhancer.ts archive/old-implementations/
[ -f "packages/extension/src/content/conversational-ai-integrated.ts" ] && git mv packages/extension/src/content/conversational-ai-integrated.ts archive/old-implementations/
[ -f "packages/extension/src/content/game-integration.ts" ] && git mv packages/extension/src/content/game-integration.ts archive/old-implementations/

# Archive build scripts we don't use
echo "Archiving unused build scripts..."
[ -f "packages/extension/build-optimizer.sh" ] && git mv packages/extension/build-optimizer.sh archive/old-scripts/

echo "Cleanup complete!"
echo ""
echo "Essential files preserved:"
echo "  - docs/SESSION_CONTEXT.md (current state)"
echo "  - docs/TravianAssistantV4.md (architecture)"
echo "  - docs/data-structures.md (game data format)"
echo "  - test-ai-agent-local.js (working AI demo)"
echo "  - test-current-state.js (diagnostic tool)"
echo ""
echo "Archived files moved to:"
echo "  - docs/archive/ (old documentation)"
echo "  - archive/old-implementations/ (abandoned code)"
echo ""
echo "Next: Commit these changes with message 'Repository cleanup and organization'"

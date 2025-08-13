#!/usr/bin/env bash
set -euo pipefail
echo "Merging Travian Legends Assistant extension into current repo..."
mkdir -p packages/shared/src packages/extension/src/{content,overlay,background,options} docs
cp -r packages/shared ./packages/
cp -r packages/extension ./packages/
cp -r docs ./
[ -f README.md ] || cp README.md ./README.md
echo "Done. Next:"
echo "  pnpm i"
echo "  pnpm -F @tla/extension build"

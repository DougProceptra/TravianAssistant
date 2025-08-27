#!/bin/bash
# Auto-increment patch version
current=$(grep '"version"' dist/manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
IFS='.' read -ra PARTS <<< "$current"
PARTS[2]=$((PARTS[2]+1))
new_version="${PARTS[0]}.${PARTS[1]}.${PARTS[2]}"
sed -i "s/\"version\": \".*\"/\"version\": \"$new_version\"/" dist/manifest.json
echo "Version bumped to $new_version"

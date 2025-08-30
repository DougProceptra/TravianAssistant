#!/usr/bin/env python3
"""
Parse the Kirilloid buildings JavaScript array and convert to clean JSON
"""

import re
import json

# Read the buildings array we extracted
with open('buildings_array.js', 'r') as f:
    js_content = f.read()

# Extract just the array content (between [ and ];)
array_match = re.search(r'var buildings = \[(.*?)\];', js_content, re.DOTALL)
if not array_match:
    print("Could not find buildings array")
    exit(1)

buildings_js = array_match.group(1)

# Split into individual building objects
building_strings = re.split(r'\},\s*\{', buildings_js)

# Clean up first and last entries
building_strings[0] = building_strings[0].lstrip('{')
building_strings[-1] = building_strings[-1].rstrip('}')

# Parse each building
buildings_data = []

for i, building_str in enumerate(building_strings):
    # Add back the braces
    building_str = '{' + building_str + '}'
    
    # Extract the basic fields using regex
    name_match = re.search(r'name:\s*"([^"]+)"', building_str)
    cost_match = re.search(r'cost:\s*\[\s*([0-9, ]+)\s*\]', building_str)
    k_match = re.search(r'k:\s*([\d.]+)', building_str)
    cu_match = re.search(r'cu:\s*(\d+)', building_str)
    cp_match = re.search(r'cp:\s*(\d+)', building_str)
    maxlvl_match = re.search(r'maxLvl:\s*(\d+)', building_str)
    
    if name_match and cost_match:
        # Parse the cost array
        costs = [int(x.strip()) for x in cost_match.group(1).split(',')]
        
        building = {
            'id': i + 1,  # Building ID (gid)
            'name': name_match.group(1),
            'baseCost': {
                'wood': costs[0] if len(costs) > 0 else 0,
                'clay': costs[1] if len(costs) > 1 else 0,
                'iron': costs[2] if len(costs) > 2 else 0,
                'crop': costs[3] if len(costs) > 3 else 0
            },
            'k': float(k_match.group(1)) if k_match else 1.0,
            'upkeep': int(cu_match.group(1)) if cu_match else 0,
            'culture': int(cp_match.group(1)) if cp_match else 0,
            'maxLevel': int(maxlvl_match.group(1)) if maxlvl_match else 20
        }
        
        buildings_data.append(building)
        print(f"Parsed: {building['name']} (gid {building['id']})")

# Save to JSON
with open('kirilloid_buildings.json', 'w') as f:
    json.dump(buildings_data, f, indent=2)

print(f"\n✅ Successfully extracted {len(buildings_data)} buildings")
print("💾 Saved to kirilloid_buildings.json")

# Now generate full level data for each building
print("\n🔧 Generating full level data for each building...")

def round5(n):
    """Round to nearest 5"""
    return int(5 * round(n / 5))

def calculate_costs(base_cost, k, level):
    """Calculate resource costs for a specific level"""
    return {
        'wood': round5(base_cost['wood'] * (k ** (level - 1))),
        'clay': round5(base_cost['clay'] * (k ** (level - 1))),
        'iron': round5(base_cost['iron'] * (k ** (level - 1))),
        'crop': round5(base_cost['crop'] * (k ** (level - 1)))
    }

# Generate complete data with all levels
complete_buildings = []

for building in buildings_data:
    building_complete = {
        'id': building['id'],
        'name': building['name'],
        'maxLevel': building['maxLevel'],
        'k': building['k'],
        'levels': []
    }
    
    # Generate data for each level
    for level in range(1, building['maxLevel'] + 1):
        costs = calculate_costs(building['baseCost'], building['k'], level)
        
        level_data = {
            'level': level,
            'wood': costs['wood'],
            'clay': costs['clay'],
            'iron': costs['iron'],
            'crop': costs['crop'],
            'upkeep': building['upkeep'],  # Simplified - actual formula is more complex
            'culture': building['culture'] * level  # Simplified
        }
        
        building_complete['levels'].append(level_data)
    
    complete_buildings.append(building_complete)
    print(f"Generated {building['maxLevel']} levels for {building['name']}")

# Save complete data
with open('kirilloid_complete.json', 'w') as f:
    json.dump(complete_buildings, f, indent=2)

print(f"\n✅ Generated complete building data")
print("💾 Saved to kirilloid_complete.json")

# Create a summary
print("\n📊 SUMMARY OF EXTRACTED BUILDINGS:")
print("-" * 50)
for building in buildings_data:
    print(f"{building['id']:2}. {building['name']:25} k={building['k']:.2f} maxLvl={building['maxLevel']}")

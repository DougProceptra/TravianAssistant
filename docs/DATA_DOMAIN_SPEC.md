# TravianAssistant Data Domain Specification
*Version: 1.0 - August 26, 2025*

## Overview
This document defines the complete data domain for TravianAssistant - what data we need to collect to provide meaningful AI-powered insights for competitive gameplay optimization.

## Primary Goal
Collect sufficient game state data to enable AI to provide advice that saves 4-8 hours on settlement timing and optimizes overall gameplay efficiency.

## Data Collection Categories

### 1. Village-Level Data
**Purpose**: Track individual village state and optimization opportunities

- **Resources**: Current amounts, production rates, storage capacity
- **Infrastructure**: All 18 fields + buildings with levels
- **Military**: Troops present, training, reinforcements
- **Queues**: Building queue, troop training queue, research
- **Celebrations**: Active celebrations and their effects

### 2. Account-Wide Data
**Purpose**: Strategic planning and milestone tracking

- **Culture Points**: Current, required for next village, daily production
- **Hero**: Level, location, adventures, items equipped
- **Population**: Total, rank, growth rate
- **Gold/Silver**: Balances and spending patterns
- **Quests**: Active quests that provide resources/rewards

### 3. Map Intelligence
**Purpose**: Threat assessment and opportunity identification

- **Nearby Players**: Within 20 squares of each village
- **Abandoned Villages**: Potential farms
- **Oases**: Bonuses and occupation status
- **Alliance Territory**: Friendly vs hostile zones
- **Settlement Spots**: Croppers and strategic locations

### 4. Military Intelligence
**Purpose**: Combat planning and defense coordination

- **Incoming Attacks**: Type, arrival time, source
- **Outgoing Troops**: Attacks, raids, reinforcements
- **Battle Reports**: Losses, gains, enemy strength estimates
- **Scouting Reports**: Enemy village compositions

### 5. Market & Economy
**Purpose**: Resource optimization and trading

- **Trade Routes**: Automated resource movements
- **Market Offers**: Current prices and ratios
- **NPC Trading**: Instant resource conversion ratios
- **Merchant Status**: Available vs in-transit

### 6. Alliance Context
**Purpose**: Coordination and strategic positioning

- **Member Strength**: Who can help defend
- **War Status**: Current conflicts and NAPs
- **Shared Intelligence**: Marked enemies, farms
- **Wonder Progress**: If in WW phase

### 7. Time-Series Analytics
**Purpose**: Trend analysis and predictions

- **Growth Rates**: Population, resource production over time
- **Efficiency Metrics**: Queue utilization, overflow frequency
- **Competitive Position**: Rank changes over time
- **Threat Evolution**: Growing nearby players

## Data Sources & Collection Methods

### Primary Sources (Reliable)
1. **dorf3.php (Overview)**: All villages summary - single fetch
2. **spieler.php (Profile)**: Player statistics and rankings
3. **statistiken.php**: Server rankings and competitive analysis

### Secondary Sources (Real-time)
1. **AJAX Interception**: Resource updates, building completion
2. **JavaScript Objects**: window.TravianGame, game state
3. **LocalStorage**: Cached game data

### Tertiary Sources (Navigation Required)
1. **karte.php (Map)**: Requires scanning for nearby villages
2. **berichte.php (Reports)**: Historical battle/scout data
3. **build.php**: Detailed building upgrade costs

## Collection Priority for Beta

### Must Have (Beta - Aug 29)
- [ ] All village resources and production
- [ ] Building and troop queues
- [ ] Culture points and requirements
- [ ] Incoming attacks detection
- [ ] Basic settlement calculator data

### Should Have (Beta Testing)
- [ ] Map scanning within 10 squares
- [ ] Recent battle reports
- [ ] Market prices
- [ ] Hero status

### Nice to Have (Production - Sep 9)
- [ ] Full map intelligence
- [ ] Historical trending
- [ ] Alliance coordination
- [ ] Farm list optimization

## AI Integration Points

### Settlement Advisor Needs
- Current CP production rate
- Total resource production
- Available merchants
- Nearby settlement spots (7x7, 9c, 15c)
- Threat assessment of area

### Next Action Advisor Needs
- Resource overflow timing
- Queue availability
- Quest requirements
- Celebration timing
- Troop completion times

### Defense Advisor Needs
- Incoming attack details
- Available troops
- Wall level
- Alliance support distance
- Time to request reinforcements

## Implementation Files Structure
```
packages/extension/src/
├── collectors/
│   ├── overview-collector.ts    # dorf3.php parser
│   ├── village-collector.ts     # dorf1/dorf2 parser  
│   ├── ajax-interceptor.ts      # Real-time updates
│   ├── memory-collector.ts      # JS object extraction
│   ├── map-scanner.ts          # Map intelligence
│   └── master-collector.ts     # Orchestrates all collectors
├── analyzers/
│   ├── settlement-analyzer.ts   # CP and settlement timing
│   ├── threat-analyzer.ts      # Military threats
│   ├── efficiency-analyzer.ts  # Resource efficiency
│   └── strategic-analyzer.ts   # Overall strategy
└── ai/
    ├── prompt-builder.ts        # Builds Claude prompts
    ├── strategic-advisor.ts    # Main AI interface
    └── action-recommender.ts    # Converts advice to actions
```

## Success Metrics

### Beta Success (Aug 29)
- Correctly identifies next settlement timing within 2 hours
- Detects all incoming attacks
- Accurate resource overflow warnings
- Provides meaningful "next action" advice

### Production Success (Sep 9)  
- Reduces settlement time by 4-8 hours
- Prevents resource overflow through timely alerts
- Optimizes build queues for CP production
- Identifies best settlement locations

## Testing Approach

### Manual Testing Checklist
1. Load extension on active game account
2. Navigate to dorf3.php - verify all villages detected
3. Check resource production calculations
4. Trigger test advice request
5. Verify advice is contextually relevant

### Automated Tests Required
- Parser tests with sample HTML
- Calculator tests with known outcomes
- AI prompt generation tests
- Data merge/deduplication tests

## Next Steps

1. **Implement collectors** (GitHub repo)
2. **Create test harness** with sample game HTML
3. **Build AI prompts** for settlement optimization
4. **Beta deployment** for team testing
5. **Iterate based on feedback**

---
*This specification drives all implementation. Code goes in GitHub. Discussion happens in session.*
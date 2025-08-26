# Travian Elite Decision Prompts

## Strategic Assessment Prompts

### Daily Strategic Review
```
Current game state: [inserted automatically]
Server age: Day {X}
My rank: {X} (Population), {X} (Attackers), {X} (Defenders)

Analyze my position relative to:
1. Server leaders - Am I catching up or falling behind?
2. Regional threats - Who can hit me in the next 48 hours?
3. Endgame positioning - Am I on track for artifact competition?
4. Hidden threats - What patterns suggest unseen dangers?

Give me three non-obvious actions I should take in the next 24 hours.
```

### Settlement Decision
```
I can settle in {X} hours.
Available locations: [list with distances, resource types, oasis]
Current server dynamics: [alliances, NAPs, threats]

Consider:
- Resource type value at this server stage
- Strategic position vs immediate economy
- Probability of chief attacks on different locations
- Signaling effects of my choice
- How this affects artifact positioning

What would 90% of players do, and why should I do something different?
```

### Military Pivot Point
```
Current troops: [complete list]
Production capacity: [barracks/stable/workshop levels]
Economic situation: [resource production, storage]
Time to artifacts: {X} days

Critical decision: Should I pivot to military now or continue economy?

Consider:
- Opportunity cost of delayed economic growth
- First-strike advantage windows
- Alliance military gaps I could fill
- Psychological impact of early aggression
- Resource ROI vs military deterrence

What signals intelligence about opponent preparations?
```

## Tactical Decision Prompts

### Under Attack
```
Incoming attack: {X} attacks landing in {Y} hours
Estimated force: [based on village size, distance, patterns]
My defensive options: [troops, resources, gold available]

Analyze:
1. Is this a real attack or fake?
2. If real, what's the attacker's goal?
3. Should I defend, dodge, or counter-attack?
4. How can I make this attack cost them more than me?
5. What does my response signal to other players?

Factor in sleep schedule, alliance support, and follow-up potential.
```

### Resource Crisis
```
Current resources: [amounts]
Production: [rates]
Needed for goal: [settlers/troops/buildings]
Time pressure: [deadline]

Options:
- Raid (who's vulnerable?)
- Trade (what rates?)
- NPC (gold cost?)
- Alliance support (political cost?)
- Delay goal (strategic cost?)

What creative solution are others not considering?
```

### Diplomacy Moment
```
Situation: [alliance offer/NAP request/resource request/threat]
Requester profile: [rank, trajectory, reputation, alliance]
Current political map: [alliances, wars, tensions]

Analyze:
- What do they really want?
- What leverage do I have?
- How does this affect server perception?
- Can I get more by delaying?
- Is this person trustworthy or will they betray?

Suggest response that maximizes my optionality.
```

## Intelligence Gathering Prompts

### Server State Analysis
```
Top 20 players data: [population, alliance, growth rate]
Alliance dynamics: [size, coordination level, internal conflicts]
Recent battles: [who won, troop losses, patterns]

Identify:
1. Who's overextended and vulnerable?
2. Which alliances have internal fractures?
3. What economic bubbles exist (overpriced market, etc)?
4. Who's preparing for artifacts (building patterns)?
5. Where are the server's power vacuums?
```

### Opponent Deep Dive
```
Target player: {name}
Available data: [statistics, village locations, growth patterns]
Recent activity: [attacks, defends, market trades]

Deduce:
- Likely troop composition
- Economic vs military focus
- Online times and sleep schedule
- Strategic goals and timeline
- Psychological profile and triggers
- Weaknesses to exploit
```

## Meta-Game Prompts

### Win Condition Assessment
```
Server age: Day {X}
My current position: [complete status]
Server dynamics: [major alliances, conflicts, trajectories]

Realistically:
1. Can I win this server?
2. If not, who can I help win?
3. What unique role can I play?
4. How do I maximize my leverage?
5. What would make this a successful server for me?
```

### Innovation Opportunity
```
Current meta: [what everyone's doing]
My unique advantages: [location, resources, relationships, knowledge]
Server-specific factors: [rules, population, culture]

Where can I innovate?
- What strategy is no one trying?
- What assumption is everyone making that might be wrong?
- What resource is undervalued?
- What timing would be unexpected?
- How can I change the game rather than play it better?
```

## Context Management Prompts

### Pattern Recognition
```
Historical data: [past X days of reports, attacks, market prices]
Notable changes: [new patterns, breaks in routine]

Identify:
- Preparation patterns (someone planning something big)
- Economic shifts (market manipulation, shortages)
- Alliance coordination (synchronized actions)
- Defensive preparations (troop movements)
- Deception attempts (false patterns)
```

### Adaptive Strategy
```
Original plan: [what we decided X days ago]
What's changed: [unexpected events, new information]
Current constraints: [resources, time, allies]

Should we:
1. Stick to the plan (sunk cost fallacy?)
2. Minor adjustment (what minimum change needed?)
3. Major pivot (is the original goal still valid?)
4. Opportunistic shift (does new option supersede?)

Consider both mechanical optimization and psychological factors.
```

## Integration with Context Tools

### When to Store Context
After each session, store:
- Strategic decisions made and reasoning
- Patterns identified in opponent behavior  
- Alliance intelligence gathered
- Personal play style preferences discovered
- Successful tactics that worked on this server

### What to Query from Context
Before major decisions:
- "What worked last time in similar situation?"
- "What patterns have we seen from this player/alliance?"
- "What strategic principles have we established?"
- "What mistakes have we made before?"
- "What server-specific dynamics have we learned?"

### Continuous Learning Loop
```
Decision → Action → Result → Analysis → Context Storage → Future Decision
```

Each decision builds on previous learning, adapting to both server dynamics and personal style.

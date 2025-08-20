# Profile Manager

## File: `src/background/profile-manager.ts`

Manages player profiles for different play styles and strategies.

```typescript
import { PlayerProfile } from '../shared/types';

export class ProfileManager {
  private profiles: Map<string, PlayerProfile> = new Map();
  private activeProfileId: string | null = null;
  
  constructor() {
    this.loadProfiles();
  }
  
  private async loadProfiles() {
    const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
    
    if (result.profiles) {
      this.profiles = new Map(Object.entries(result.profiles));
    }
    
    this.activeProfileId = result.activeProfileId || null;
    
    // Create default profile if none exists
    if (this.profiles.size === 0) {
      const defaultProfile = this.createDefaultProfile();
      await this.saveProfile(defaultProfile);
      await this.setActiveProfile(defaultProfile.id);
    }
  }
  
  private createDefaultProfile(): PlayerProfile {
    return {
      id: this.generateId(),
      name: 'Default Profile',
      tribe: 'Egyptians',
      style: 'economic',
      goldUsage: 'minimal',
      hoursPerDay: 2,
      checkInsPerDay: 4,
      primaryGoal: 'topClimber',
      weights: {
        economy: 0.7,
        military: 0.2,
        alliance: 0.1,
        risk: 0.3
      }
    };
  }
  
  async saveProfile(profile: PlayerProfile): Promise<PlayerProfile> {
    if (!profile.id) {
      profile.id = this.generateId();
    }
    
    this.profiles.set(profile.id, profile);
    await this.persistProfiles();
    
    return profile;
  }
  
  async deleteProfile(profileId: string): Promise<boolean> {
    if (this.profiles.size <= 1) {
      return false; // Can't delete last profile
    }
    
    this.profiles.delete(profileId);
    
    if (this.activeProfileId === profileId) {
      // Switch to first available profile
      const firstProfile = this.profiles.values().next().value;
      if (firstProfile) {
        await this.setActiveProfile(firstProfile.id);
      }
    }
    
    await this.persistProfiles();
    return true;
  }
  
  async setActiveProfile(profileId: string): Promise<boolean> {
    if (!this.profiles.has(profileId)) {
      return false;
    }
    
    this.activeProfileId = profileId;
    await chrome.storage.local.set({ activeProfileId: profileId });
    
    return true;
  }
  
  async getActiveProfile(): Promise<PlayerProfile | null> {
    if (!this.activeProfileId) {
      return null;
    }
    
    return this.profiles.get(this.activeProfileId) || null;
  }
  
  async getAllProfiles(): Promise<PlayerProfile[]> {
    return Array.from(this.profiles.values());
  }
  
  async importProfile(code: string): Promise<PlayerProfile | null> {
    try {
      // Remove prefix if present
      const cleanCode = code.replace('TLA-PROFILE:', '');
      const decoded = atob(cleanCode);
      const profile = JSON.parse(decoded) as PlayerProfile;
      
      // Generate new ID to avoid conflicts
      profile.id = this.generateId();
      
      // Add imported suffix to name
      profile.name = `${profile.name} (Imported)`;
      
      await this.saveProfile(profile);
      return profile;
    } catch (error) {
      console.error('Failed to import profile:', error);
      return null;
    }
  }
  
  async exportProfile(profileId: string): Promise<string | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }
    
    const json = JSON.stringify(profile);
    const encoded = btoa(json);
    return `TLA-PROFILE:${encoded}`;
  }
  
  private async persistProfiles() {
    const profilesObj = Object.fromEntries(this.profiles);
    await chrome.storage.local.set({ profiles: profilesObj });
  }
  
  private generateId(): string {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Profile Examples

### Egyptian Economic Profile
```typescript
{
  id: 'profile-xxx',
  name: 'Egyptian Farmer',
  tribe: 'Egyptians',
  style: 'economic',
  goldUsage: 'aggressive',
  hoursPerDay: 1.5,
  checkInsPerDay: 4,
  primaryGoal: 'topClimber',
  weights: {
    economy: 0.8,
    military: 0.1,
    alliance: 0.1,
    risk: 0.2
  }
}
```

### Teuton Aggressive Profile
```typescript
{
  id: 'profile-yyy',
  name: 'Teuton Raider',
  tribe: 'Teutons',
  style: 'aggressive',
  goldUsage: 'moderate',
  hoursPerDay: 3,
  checkInsPerDay: 8,
  primaryGoal: 'top10Attack',
  weights: {
    economy: 0.3,
    military: 0.6,
    alliance: 0.1,
    risk: 0.7
  }
}
```

### Gaul Defensive Profile
```typescript
{
  id: 'profile-zzz',
  name: 'Gaul Defender',
  tribe: 'Gauls',
  style: 'defensive',
  goldUsage: 'minimal',
  hoursPerDay: 2,
  checkInsPerDay: 5,
  primaryGoal: 'top10Defense',
  weights: {
    economy: 0.4,
    military: 0.4,
    alliance: 0.2,
    risk: 0.1
  }
}
```

## Sharing Profiles

Profiles can be exported as base64-encoded strings:

```
TLA-PROFILE:eyJpZCI6InByb2ZpbGUtMTcwNDIxMjQwMC1hYmMxMjMiLCJuYW1lIjoiRWd5cHRpYW4gRmFybWVyIiwidHJpYmUiOiJFZ3lwdGlhbnMiLCJzdHlsZSI6ImVjb25vbWljIiwiZ29sZFVzYWdlIjoiYWdncmVzc2l2ZSIsImhvdXJzUGVyRGF5IjoxLjUsImNoZWNrSW5zUGVyRGF5Ijo0LCJwcmltYXJ5R29hbCI6InRvcENsaW1iZXIiLCJ3ZWlnaHRzIjp7ImVjb25vbXkiOjAuOCwibWlsaXRhcnkiOjAuMSwi
```

Friends can import this code to use the same strategy settings.
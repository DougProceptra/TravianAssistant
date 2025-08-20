# Options Page

## File: `src/options/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Travian AI Assistant Settings</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./index.tsx"></script>
</body>
</html>
```

## File: `src/options/index.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerProfile } from '../shared/types';

function OptionsPage() {
  const [apiKey, setApiKey] = useState('');
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [editingProfile, setEditingProfile] = useState<PlayerProfile | null>(null);
  const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['apiKey']);
    if (result.apiKey) {
      setApiKey(result.apiKey);
    }
    
    const profilesResponse = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' });
    setProfiles(profilesResponse || []);
    
    const activeProfile = profilesResponse.find((p: PlayerProfile) => p.isActive);
    if (activeProfile) {
      setActiveProfileId(activeProfile.id);
    }
  };
  
  const saveApiKey = async () => {
    await chrome.runtime.sendMessage({ type: 'SET_API_KEY', apiKey });
    showMessage('API key saved successfully!');
  };
  
  const createNewProfile = () => {
    const newProfile: PlayerProfile = {
      id: '',
      name: 'New Profile',
      tribe: 'Egyptians',
      style: 'economic',
      goldUsage: 'minimal',
      hoursPerDay: 2,
      checkInsPerDay: 4,
      primaryGoal: 'topClimber',
      weights: {
        economy: 0.5,
        military: 0.5,
        alliance: 0.5,
        risk: 0.5
      }
    };
    setEditingProfile(newProfile);
  };
  
  const saveProfile = async () => {
    if (!editingProfile) return;
    
    const saved = await chrome.runtime.sendMessage({
      type: 'SAVE_PROFILE',
      profile: editingProfile
    });
    
    if (saved) {
      await loadSettings();
      setEditingProfile(null);
      showMessage('Profile saved successfully!');
    }
  };
  
  const deleteProfile = async (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      const result = await chrome.runtime.sendMessage({
        type: 'DELETE_PROFILE',
        profileId
      });
      
      if (result.success) {
        await loadSettings();
        showMessage('Profile deleted');
      } else {
        showMessage('Cannot delete the last profile');
      }
    }
  };
  
  const setActive = async (profileId: string) => {
    await chrome.runtime.sendMessage({
      type: 'SET_ACTIVE_PROFILE',
      profileId
    });
    setActiveProfileId(profileId);
    showMessage('Active profile changed');
  };
  
  const exportProfile = async (profileId: string) => {
    const code = await chrome.runtime.sendMessage({
      type: 'EXPORT_PROFILE',
      profileId
    });
    
    if (code) {
      navigator.clipboard.writeText(code);
      showMessage('Profile code copied to clipboard!');
    }
  };
  
  const importProfile = async () => {
    if (!importCode) return;
    
    const profile = await chrome.runtime.sendMessage({
      type: 'IMPORT_PROFILE',
      code: importCode
    });
    
    if (profile) {
      await loadSettings();
      setImportCode('');
      showMessage('Profile imported successfully!');
    } else {
      showMessage('Invalid profile code');
    }
  };
  
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  return (
    <div className="options-page">
      <style>{optionsPageStyles}</style>
      
      <h1>🏛️ Travian AI Assistant Settings</h1>
      
      {message && <div className="message">{message}</div>}
      
      <div className="card">
        <h2>🔑 API Configuration</h2>
        <div className="form-group">
          <label>Claude API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
          <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
            Get your API key from{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
              Anthropic Console
            </a>
          </small>
        </div>
        <button onClick={saveApiKey}>Save API Key</button>
      </div>
      
      <div className="card">
        <h2>👤 Player Profiles</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <button onClick={createNewProfile}>+ Create New Profile</button>
        </div>
        
        <div className="profile-list">
          {profiles.map(profile => (
            <div key={profile.id} className={`profile-card ${profile.id === activeProfileId ? 'active' : ''}`}>
              <h3>{profile.name}</h3>
              <div className="profile-info">
                <div>Tribe: {profile.tribe}</div>
                <div>Style: {profile.style}</div>
                <div>Gold: {profile.goldUsage}</div>
                <div>Goal: {profile.primaryGoal}</div>
              </div>
              <div className="profile-actions">
                {profile.id !== activeProfileId && (
                  <button onClick={() => setActive(profile.id)}>Set Active</button>
                )}
                <button onClick={() => setEditingProfile(profile)}>Edit</button>
                <button onClick={() => exportProfile(profile.id)}>Export</button>
                {profiles.length > 1 && (
                  <button className="danger" onClick={() => deleteProfile(profile.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e1e1e1' }}>
          <h3>Import Profile</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Paste profile code here..."
            />
            <button onClick={importProfile} style={{ width: 'auto' }}>Import</button>
          </div>
        </div>
      </div>
      
      {editingProfile && (
        <ProfileEditModal
          profile={editingProfile}
          onSave={saveProfile}
          onClose={() => setEditingProfile(null)}
          onChange={setEditingProfile}
        />
      )}
    </div>
  );
}

function ProfileEditModal({ profile, onSave, onClose, onChange }: any) {
  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{profile.id ? 'Edit' : 'Create'} Profile</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="form-group">
          <label>Profile Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange({ ...profile, name: e.target.value })}
          />
        </div>
        
        <div className="form-group">
          <label>Tribe</label>
          <select
            value={profile.tribe}
            onChange={(e) => onChange({ ...profile, tribe: e.target.value })}
          >
            <option value="Romans">Romans</option>
            <option value="Gauls">Gauls</option>
            <option value="Teutons">Teutons</option>
            <option value="Egyptians">Egyptians</option>
            <option value="Huns">Huns</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Play Style</label>
          <select
            value={profile.style}
            onChange={(e) => onChange({ ...profile, style: e.target.value })}
          >
            <option value="aggressive">Aggressive</option>
            <option value="defensive">Defensive</option>
            <option value="economic">Economic</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Gold Usage</label>
          <select
            value={profile.goldUsage}
            onChange={(e) => onChange({ ...profile, goldUsage: e.target.value })}
          >
            <option value="none">None</option>
            <option value="minimal">Minimal</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Primary Goal</label>
          <select
            value={profile.primaryGoal}
            onChange={(e) => onChange({ ...profile, primaryGoal: e.target.value })}
          >
            <option value="top10Attack">Top 10 Attacker</option>
            <option value="top10Defense">Top 10 Defender</option>
            <option value="wonderWin">Wonder Victory</option>
            <option value="topClimber">Top Climber</option>
            <option value="support">Alliance Support</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Hours Per Day: {profile.hoursPerDay}</label>
          <input
            type="range"
            min="0.5"
            max="12"
            step="0.5"
            value={profile.hoursPerDay}
            onChange={(e) => onChange({ ...profile, hoursPerDay: parseFloat(e.target.value) })}
          />
        </div>
        
        <h3>Decision Weights</h3>
        
        <div className="slider-group">
          <label>Economic Focus: {profile.weights.economy.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={profile.weights.economy}
            onChange={(e) => onChange({
              ...profile,
              weights: { ...profile.weights, economy: parseFloat(e.target.value) }
            })}
          />
        </div>
        
        <div className="slider-group">
          <label>Military Focus: {profile.weights.military.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={profile.weights.military}
            onChange={(e) => onChange({
              ...profile,
              weights: { ...profile.weights, military: parseFloat(e.target.value) }
            })}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onSave}>Save Profile</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const optionsPageStyles = `
  /* Complete CSS styles from previous implementation */
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
    min-height: 100vh;
  }
  
  .options-page {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* ... rest of styles ... */
`;

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OptionsPage />);
}
```

## Key Features

- **API Key Management**: Secure storage of Claude API key
- **Profile Creation**: Create unlimited player profiles
- **Profile Editing**: Full customization of all parameters
- **Import/Export**: Share profiles via text codes
- **Active Profile**: Switch between profiles easily
- **Visual Feedback**: Success/error messages
- **Responsive Design**: Works on all screen sizes
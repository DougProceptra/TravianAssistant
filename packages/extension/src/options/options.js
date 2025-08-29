/**
 * Options page JavaScript
 * Handles saving and loading extension settings
 */

import { saveServerConfig, ServerConfig, ServerPresets } from '../game-data/server-config';
import TestScenarios from '../tests/formula-tests';

// DOM elements
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  elements = {
    serverSpeed: document.getElementById('server-speed'),
    serverVersion: document.getElementById('server-version'),
    worldSize: document.getElementById('world-size'),
    tribe: document.getElementById('tribe'),
    apiKey: document.getElementById('api-key'),
    aiModel: document.getElementById('ai-model'),
    autoRefresh: document.getElementById('auto-refresh'),
    showHud: document.getElementById('show-hud'),
    enableNotifications: document.getElementById('enable-notifications'),
    saveButton: document.getElementById('save-settings'),
    saveStatus: document.getElementById('save-status'),
    testFormulas: document.getElementById('test-formulas'),
    testOutput: document.getElementById('test-output'),
    testResults: document.getElementById('test-results'),
    clearCache: document.getElementById('clear-cache'),
    exportSettings: document.getElementById('export-settings'),
    importSettings: document.getElementById('import-settings'),
    importFile: document.getElementById('import-file')
  };

  // Load current settings
  loadSettings();

  // Set up event listeners
  elements.saveButton.addEventListener('click', saveSettings);
  elements.testFormulas.addEventListener('click', runFormulaTests);
  elements.clearCache.addEventListener('click', clearCache);
  elements.exportSettings.addEventListener('click', exportSettings);
  elements.importSettings.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importSettings);

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = e.target.dataset.preset;
      applyPreset(preset);
    });
  });
});

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'serverSettings',
      'apiKey',
      'aiModel',
      'tribe',
      'autoRefresh',
      'showHud',
      'enableNotifications'
    ]);

    // Apply server settings
    if (settings.serverSettings) {
      elements.serverSpeed.value = settings.serverSettings.speed || 2;
      elements.serverVersion.value = settings.serverSettings.version || 't4';
      elements.worldSize.value = settings.serverSettings.worldSize || 401;
    }

    // Apply other settings
    if (settings.apiKey) elements.apiKey.value = settings.apiKey;
    if (settings.aiModel) elements.aiModel.value = settings.aiModel;
    if (settings.tribe) elements.tribe.value = settings.tribe;
    
    elements.autoRefresh.checked = settings.autoRefresh !== false;
    elements.showHud.checked = settings.showHud !== false;
    elements.enableNotifications.checked = settings.enableNotifications === true;

    showStatus('Settings loaded', 'success');
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
  try {
    const serverSettings = {
      speed: parseInt(elements.serverSpeed.value),
      version: elements.serverVersion.value,
      troopSpeed: parseInt(elements.serverSpeed.value),
      merchantSpeed: parseInt(elements.serverSpeed.value),
      buildingSpeed: parseInt(elements.serverSpeed.value),
      unitTrainingSpeed: parseInt(elements.serverSpeed.value),
      worldSize: parseInt(elements.worldSize.value)
    };

    // Save to chrome storage
    await chrome.storage.sync.set({
      serverSettings,
      apiKey: elements.apiKey.value,
      aiModel: elements.aiModel.value,
      tribe: elements.tribe.value,
      autoRefresh: elements.autoRefresh.checked,
      showHud: elements.showHud.checked,
      enableNotifications: elements.enableNotifications.checked
    });

    // Update server config in memory
    await saveServerConfig(serverSettings);

    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts about settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('travian.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: serverSettings
          });
        }
      });
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

/**
 * Apply a preset configuration
 */
function applyPreset(preset) {
  switch (preset) {
    case 'current-2x':
      elements.serverSpeed.value = '2';
      elements.serverVersion.value = 't4';
      elements.worldSize.value = '401';
      showStatus('Applied 2x server preset', 'success');
      break;
      
    case 'annual-special':
      elements.serverSpeed.value = '1';
      elements.serverVersion.value = 't4.fs';
      elements.worldSize.value = '401';
      showStatus('Applied Annual Special preset (starts Sept 9)', 'success');
      break;
      
    case 'speed-server':
      elements.serverSpeed.value = '5';
      elements.serverVersion.value = 't4';
      elements.worldSize.value = '401';
      showStatus('Applied 5x speed server preset', 'success');
      break;
  }
}

/**
 * Run formula tests
 */
function runFormulaTests() {
  elements.testOutput.style.display = 'block';
  
  // Capture console output
  const originalLog = console.log;
  const output = [];
  
  console.log = (...args) => {
    output.push(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' '));
  };

  // Run tests
  try {
    TestScenarios.runAll();
    elements.testResults.textContent = output.join('\n');
    showStatus('Formula tests completed', 'success');
  } catch (error) {
    elements.testResults.textContent = `Error: ${error.message}\n${error.stack}`;
    showStatus('Formula tests failed', 'error');
  } finally {
    console.log = originalLog;
  }
}

/**
 * Clear cache
 */
async function clearCache() {
  try {
    await chrome.storage.local.clear();
    showStatus('Cache cleared', 'success');
  } catch (error) {
    showStatus('Error clearing cache', 'error');
  }
}

/**
 * Export settings
 */
async function exportSettings() {
  try {
    const settings = await chrome.storage.sync.get();
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travian-assistant-settings-${Date.now()}.json`;
    a.click();
    showStatus('Settings exported', 'success');
  } catch (error) {
    showStatus('Error exporting settings', 'error');
  }
}

/**
 * Import settings
 */
async function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    await chrome.storage.sync.set(settings);
    await loadSettings();
    showStatus('Settings imported successfully', 'success');
  } catch (error) {
    showStatus('Error importing settings', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `status ${type}`;
  
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'status';
  }, 3000);
}

// Centralized version management
// Update this file when releasing new versions

export const VERSION = '0.7.9';
export const VERSION_NAME = 'Chat AI Integration';
export const BUILD_DATE = new Date().toISOString();

// Version history for tracking
export const VERSION_HISTORY = [
  { version: '0.7.0', date: '2025-08-27', changes: 'Fixed URL error, standardized versions' },
  { version: '0.6.4', date: '2025-08-26', changes: 'Added getAllCachedVillages method' },
  { version: '0.6.0', date: '2025-08-26', changes: 'Chat-based AI integration' },
  { version: '0.5.1', date: '2025-08-25', changes: 'Enhanced scraper with safe mode' },
];

export function getVersionString(): string {
  return `v${VERSION}`;
}

export function getFullVersionString(): string {
  return `v${VERSION} - ${VERSION_NAME}`;
}
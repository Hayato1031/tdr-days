// App constants - single source of truth for app metadata
export const APP_CONFIG = {
  // Version info - update this when releasing new versions
  VERSION: '1.1.0',
  VERSION_CODE: 10100,
  
  // App metadata
  NAME: 'TDR Days',
  FULL_NAME: 'TDR-Days',
  
  // Copyright and team info
  COPYRIGHT_YEAR: '2025',
  TEAM_NAME: 'TDR Days Team',
  
  // Package info
  PACKAGE_ID: 'com.hayatonakamura.TDRDays',
  
  // Support and contact
  SUPPORT_EMAIL: 'support@tdrdays.com',
  
  // Release notes URL or info
  RELEASE_NOTES_URL: 'https://github.com/your-repo/releases',
  
  // Store URLs
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.hayatonakamura.TDRDays',
  APP_STORE_URL: 'https://apps.apple.com/app/tdr-days/id...',
};

// Helper functions for formatted strings
export const getVersionString = (includeCode = false): string => {
  return includeCode 
    ? `${APP_CONFIG.NAME} v${APP_CONFIG.VERSION} (${APP_CONFIG.VERSION_CODE})`
    : `${APP_CONFIG.NAME} v${APP_CONFIG.VERSION}`;
};

export const getCopyrightString = (): string => {
  return `© ${APP_CONFIG.COPYRIGHT_YEAR} ${APP_CONFIG.TEAM_NAME}`;
};

export const getFullVersionInfo = (): string => {
  return `${APP_CONFIG.FULL_NAME} v${APP_CONFIG.VERSION}`;
};
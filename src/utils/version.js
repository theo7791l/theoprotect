import { readFileSync } from 'fs';
import axios from 'axios';

/**
 * Get current bot version from package.json
 */
export function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error('[Version] Failed to read package.json:', error);
    return 'unknown';
  }
}

/**
 * Check for updates from GitHub releases
 */
export async function checkForUpdates() {
  try {
    const currentVersion = getCurrentVersion();
    
    const response = await axios.get(
      'https://api.github.com/repos/theo7791l/theoprotect/releases/latest',
      { timeout: 10000 }
    );

    const latestVersion = response.data.tag_name.replace('v', '');
    const hasUpdate = currentVersion !== latestVersion && latestVersion !== 'unknown';

    return {
      current: currentVersion,
      latest: latestVersion,
      hasUpdate,
      releaseUrl: response.data.html_url,
      publishedAt: response.data.published_at
    };
  } catch (error) {
    console.error('[Version] Failed to check updates:', error.message);
    return {
      current: getCurrentVersion(),
      latest: null,
      hasUpdate: false,
      error: error.message
    };
  }
}

/**
 * Compare two semantic versions
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}
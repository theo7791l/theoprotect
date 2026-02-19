import { fileURLToPath } from 'url';
import { dirname, join, resolve, sep } from 'path';

/**
 * Cross-platform path utilities
 * Works on Windows, Linux, and macOS
 */

export function getProjectRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Go up from src/utils to project root
  return resolve(__dirname, '..', '..');
}

export function getSourceDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Go up from src/utils to src
  return resolve(__dirname, '..');
}

export function getCommandsPath() {
  return join(getSourceDir(), 'commands');
}

export function getEventsPath() {
  return join(getSourceDir(), 'events');
}

export function getDataPath() {
  return join(getProjectRoot(), 'data');
}

export function getDatabasePath() {
  return process.env.DATABASE_PATH || join(getDataPath(), 'theoprotect.db');
}

/**
 * Normalize path separators for the current platform
 */
export function normalizePath(path) {
  return path.split(/[\\/]/).join(sep);
}

/**
 * Get file URL for dynamic import (cross-platform)
 */
export function getFileUrl(filePath) {
  // Windows needs file:/// protocol
  if (process.platform === 'win32') {
    return `file:///${filePath.replace(/\\/g, '/')}`;
  }
  return `file://${filePath}`;
}
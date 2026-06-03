/**
 * Local Storage Utility for VibeTools
 * Provides common functions to save and restore tool state
 */

const STORAGE_PREFIX = 'vibetools_';
const STORAGE_VERSION = 'v1';

export interface ToolState {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  options?: Record<string, any>;
  timestamp?: number;
}

/**
 * Generate storage key for a tool
 */
const getStorageKey = (toolName: string): string => {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}_${toolName}`;
};

/**
 * Save tool state to localStorage
 */
export const saveToolState = (toolName: string, state: ToolState): void => {
  try {
    const key = getStorageKey(toolName);
    const dataToSave = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    console.error(`Failed to save state for ${toolName}:`, error);
  }
};

/**
 * Load tool state from localStorage
 */
export const loadToolState = (toolName: string): ToolState | null => {
  try {
    const key = getStorageKey(toolName);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    return JSON.parse(data) as ToolState;
  } catch (error) {
    console.error(`Failed to load state for ${toolName}:`, error);
    return null;
  }
};

/**
 * Clear tool state from localStorage
 */
export const clearToolState = (toolName: string): void => {
  try {
    const key = getStorageKey(toolName);
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to clear state for ${toolName}:`, error);
  }
};

/**
 * Clear all tool states from localStorage
 */
export const clearAllToolStates = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `${STORAGE_PREFIX}${STORAGE_VERSION}_`;
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear all tool states:', error);
  }
};

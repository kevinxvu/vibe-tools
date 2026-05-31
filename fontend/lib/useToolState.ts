import { useEffect, useRef } from 'react';
import { saveToolState, loadToolState, ToolState } from './localStorage';

/**
 * Custom hook to manage tool state with localStorage persistence
 * 
 * @param toolName - Unique identifier for the tool
 * @param stateDeps - Object containing the state values to save
 * @param shouldSave - Optional flag to control when to save (default: true)
 * 
 * @returns Object with loadState function
 * 
 * @example
 * const { loadState } = useToolState('base64-converter', {
 *   inputs: { text: input },
 *   outputs: { result: output },
 *   options: { mode }
 * });
 * 
 * // Load state on mount
 * useEffect(() => {
 *   const saved = loadState();
 *   if (saved) {
 *     setInput(saved.inputs.text || '');
 *     setOutput(saved.outputs.result || '');
 *   }
 * }, []);
 */
export const useToolState = (
  toolName: string,
  stateDeps: Omit<ToolState, 'timestamp'>,
  shouldSave: boolean = true
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save state whenever dependencies change (debounced)
  useEffect(() => {
    if (!shouldSave) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce save to avoid excessive writes
    timeoutRef.current = setTimeout(() => {
      // Only save if there's actual content
      const hasContent = Object.values(stateDeps.inputs || {}).some(val => {
        if (typeof val === 'string') return val.trim().length > 0;
        if (typeof val === 'boolean' || typeof val === 'number') return true;
        return val != null;
      });

      if (hasContent) {
        saveToolState(toolName, stateDeps);
      }
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toolName, JSON.stringify(stateDeps), shouldSave]);

  /**
   * Load saved state from localStorage
   */
  const loadState = (): ToolState | null => {
    return loadToolState(toolName);
  };

  return { loadState };
};

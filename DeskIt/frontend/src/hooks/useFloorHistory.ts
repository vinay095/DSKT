import { useState, useCallback, useEffect } from 'react';
import { FloorPlan } from '../types/floorplan';

const MAX_HISTORY_LIMIT = 50;

export function useFloorHistory(
  initialState: FloorPlan,
  onStateChange?: (newPlan: FloorPlan) => void
) {
  const [history, setHistory] = useState<FloorPlan[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const currentPlan = history[currentIndex] || initialState;

  /**
   * Pushes a new state to the history stack (truncating any forward redo states).
   */
  const pushState = useCallback(
    (newPlan: FloorPlan) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, currentIndex + 1);
        const updated = [...truncated, newPlan];
        if (updated.length > MAX_HISTORY_LIMIT) {
          return updated.slice(updated.length - MAX_HISTORY_LIMIT);
        }
        return updated;
      });
      setCurrentIndex((prevIndex) => {
        return Math.min(prevIndex + 1, MAX_HISTORY_LIMIT - 1);
      });
      if (onStateChange) onStateChange(newPlan);
    },
    [currentIndex, onStateChange]
  );

  /**
   * Undoes the last action (Ctrl + Z).
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      if (onStateChange) onStateChange(history[prevIndex]);
    }
  }, [currentIndex, history, onStateChange]);

  /**
   * Redoes the next action (Ctrl + Y).
   */
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (onStateChange) onStateChange(history[nextIndex]);
    }
  }, [currentIndex, history, onStateChange]);

  // Keyboard shortcut listener for Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger when typing in input fields
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    currentPlan,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex,
  };
}

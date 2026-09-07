import { useCallback, useState } from 'react';

/**
 * Minimal undo/redo stack. `present` is the current value; mutations go through
 * `set` (pushes history) or `replace` (no history, e.g. live drag preview).
 */
export function useHistory<T>(initial: T) {
  const [stack, setStack] = useState<{ past: T[]; present: T; future: T[] }>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setStack((s) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next;
      if (Object.is(value, s.present)) return s;
      return {
        past: [...s.past, s.present],
        present: value,
        future: [],
      };
    });
  }, []);

  const replace = useCallback((next: T | ((prev: T) => T)) => {
    setStack((s) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next;
      return { ...s, present: value };
    });
  }, []);

  const undo = useCallback(() => {
    setStack((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        present: previous,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setStack((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        past: [...s.past, s.present],
        present: next,
        future: s.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((value: T) => {
    setStack({ past: [], present: value, future: [] });
  }, []);

  /** Finish a live edit: push `from` into past and keep `to` as present. */
  const commit = useCallback((from: T, to: T) => {
    setStack((s) => ({
      past: [...s.past, from],
      present: to,
      future: [],
    }));
  }, []);

  return {
    present: stack.present,
    set,
    replace,
    commit,
    undo,
    redo,
    reset,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
  };
}

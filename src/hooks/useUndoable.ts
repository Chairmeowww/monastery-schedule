import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Wraps any state updater with undo/redo. Persists last 50 states.
 */
export function useUndoable<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback((next: T | ((cur: T) => T)) => {
    setPresent((cur) => {
      const computed = typeof next === 'function' ? (next as (c: T) => T)(cur) : next;
      if (computed === cur) return cur;
      past.current.push(cur);
      if (past.current.length > 50) past.current.shift();
      future.current = [];
      return computed;
    });
  }, []);

  const undo = useCallback(() => {
    setPresent((cur) => {
      const prev = past.current.pop();
      if (prev === undefined) return cur;
      future.current.unshift(cur);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((cur) => {
      const next = future.current.shift();
      if (next === undefined) return cur;
      past.current.push(cur);
      return next;
    });
  }, []);

  /** Replace state without affecting undo history (for loading from storage). */
  const replace = useCallback((next: T) => {
    past.current = [];
    future.current = [];
    setPresent(next);
  }, []);

  // Cmd/Ctrl-Z + Cmd/Ctrl-Shift-Z global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { value: present, set, undo, redo, replace };
}

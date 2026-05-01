import { useEffect, useRef, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // ignore parse errors
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // storage may be full — silently ignore in MVP
    }
  }, [value]);

  return [value, setValue] as const;
}

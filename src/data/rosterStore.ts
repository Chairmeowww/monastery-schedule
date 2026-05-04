import type { Ability, Sister } from '../types';
import { SEED_ROSTER, applyActiveRoster } from './roster';

const ROSTER_KEY = 'monastery-schedule:roster';

const ALL_ABILITIES: Ability[] = [
  'dinner_cook',
  'supper_cook',
  'table_server',
  'eucharist_setup',
  'shipping',
  'soup_maker',
  'honey_mix',
  'honey_fill',
  'honey_labels',
  'honey_lids',
  'garden',
  'laundry',
  'ironing',
  'cleaning',
  'driver',
];

function isSister(s: unknown): s is Sister {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Array.isArray(o.abilities) &&
    Array.isArray(o.restrictions)
  );
}

export function loadActiveRoster(): Sister[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return SEED_ROSTER.map(cloneSister);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isSister)) {
      return SEED_ROSTER.map(cloneSister);
    }
    return parsed.map(cloneSister);
  } catch {
    return SEED_ROSTER.map(cloneSister);
  }
}

export function saveActiveRoster(roster: Sister[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch {
    // storage unavailable — silent
  }
  applyActiveRoster(roster);
}

/** Initialize on app start so any module that imports SISTER_BY_ID sees the saved roster. */
export function initRoster(): Sister[] {
  const r = loadActiveRoster();
  applyActiveRoster(r);
  return r;
}

export function makeNewSister(name: string): Sister {
  const id = slugify(name) || `sister-${Date.now()}`;
  return {
    id,
    name: name.trim() || 'New Sister',
    abilities: [],
    restrictions: [],
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cloneSister(s: Sister): Sister {
  return {
    ...s,
    abilities: [...s.abilities],
    restrictions: [...s.restrictions],
  };
}

export { ALL_ABILITIES };

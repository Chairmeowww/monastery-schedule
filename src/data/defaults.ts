import type { Assignment, DayOfWeek, Week } from '../types';

/**
 * Seed table-service rotation. Used as the fallback standing pattern when the
 * user has never saved one. Wed alternates Victoria / Karen — defaults to
 * Victoria; user adjusts.
 */
export const TABLE_STANDING: Record<DayOfWeek, string> = {
  mon: 'suz',
  tue: 'gertrude',
  wed: 'victoria',
  thu: 'suz',
  fri: 'claire',
  sat: 'angela_jonah',
  sun: 'ann_marie',
};

/**
 * Seed shipping rotation Mon–Thu, chosen to avoid clashing with table-service
 * standing on the same day: Tue → Karen (Gertrude is on table); Wed → Gertrude;
 * Mon/Thu → Claire (Suz is on table).
 */
export const SHIPPING_STANDING: Partial<Record<DayOfWeek, string>> = {
  mon: 'claire',
  tue: 'karen',
  wed: 'gertrude',
  thu: 'claire',
};

/** Seed soup days. Mon/Wed per R9; Sun because Sunday supper or lunch always has soup. */
export const SEED_SOUP_DAYS: DayOfWeek[] = ['mon', 'wed', 'sun'];

/** Hardcoded seed assignments — used when the user has not saved a standing pattern. */
function seedAssignments(): Assignment[] {
  const a: Assignment[] = [];
  (Object.keys(TABLE_STANDING) as DayOfWeek[]).forEach((day) => {
    a.push({ day, slot: 'table', sisterIds: [TABLE_STANDING[day]] });
  });
  (Object.keys(SHIPPING_STANDING) as DayOfWeek[]).forEach((day) => {
    const id = SHIPPING_STANDING[day];
    if (id) a.push({ day, slot: 'shipping', sisterIds: [id] });
  });
  // Angela Jonah laundry Mon (R14)
  a.push({ day: 'mon', slot: 'laundry', sisterIds: ['angela_jonah'] });
  return a;
}

const STANDING_KEY = 'monastery-schedule:standing-pattern';

export type StandingPattern = {
  assignments: Assignment[];
  soupDays: DayOfWeek[];
  savedAt: string; // ISO timestamp
};

/** Read the user-saved standing pattern, or null if none has been saved. */
export function loadStandingPattern(): StandingPattern | null {
  try {
    const raw = localStorage.getItem(STANDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StandingPattern;
    if (!parsed?.assignments || !parsed?.soupDays) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist the given assignments + soupDays as the new standing pattern. */
export function saveStandingPattern(assignments: Assignment[], soupDays: DayOfWeek[]): void {
  try {
    const pattern: StandingPattern = {
      assignments: assignments.map((a) => ({ ...a, sisterIds: [...a.sisterIds] })),
      soupDays: [...soupDays],
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STANDING_KEY, JSON.stringify(pattern));
  } catch {
    // storage unavailable — silent fail
  }
}

/** Forget the user-saved standing pattern; future resets fall back to the seed. */
export function clearStandingPattern(): void {
  try {
    localStorage.removeItem(STANDING_KEY);
  } catch {
    // ignore
  }
}

/** Pre-filled assignments for a fresh week — user-saved pattern, or seed fallback. */
export function defaultAssignments(): Assignment[] {
  const saved = loadStandingPattern();
  if (saved) return saved.assignments.map((a) => ({ ...a, sisterIds: [...a.sisterIds] }));
  return seedAssignments();
}

/** Default soup days for a fresh week — user-saved pattern, or seed fallback. */
export function defaultSoupDays(): DayOfWeek[] {
  const saved = loadStandingPattern();
  if (saved) return [...saved.soupDays];
  return [...SEED_SOUP_DAYS];
}

export function freshWeek(weekOf: string): Week {
  return {
    weekOf,
    privateSolitude: [],
    appointments: [],
    assignments: defaultAssignments(),
    dismissals: {},
    soupDays: defaultSoupDays(),
  };
}

/** Empty week — used by the "Clear all" action. */
export function emptyWeek(weekOf: string): Week {
  return {
    weekOf,
    privateSolitude: [],
    appointments: [],
    assignments: [],
    dismissals: {},
    soupDays: [],
  };
}

/** Convert any date to the Monday of that ISO week, returned as YYYY-MM-DD. */
export function mondayOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // 0=Sun, 1=Mon, ..., 6=Sat — shift to Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function isSpringSummer(iso: string): boolean {
  const d = fromISODate(iso);
  const month = d.getMonth() + 1;
  const dayOfMonth = d.getDate();
  // Mar 20 – Sep 22
  if (month < 3 || month > 9) return false;
  if (month === 3 && dayOfMonth < 20) return false;
  if (month === 9 && dayOfMonth > 22) return false;
  return true;
}

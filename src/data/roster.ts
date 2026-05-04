import type { Sister } from '../types';

/**
 * Seed roster from the brief's rules. The live roster (with Suz's edits/additions)
 * is held in localStorage by `rosterStore.ts`; on load it overwrites `ROSTER` and
 * `SISTER_BY_ID` in place so the rules engine continues to read the current names.
 *
 * Sister-specific rule constants below (HONEY_FILL, SOUP_MAKERS, etc.) reference the
 * original 9 sisters' IDs. Newly added sisters do NOT inherit these specialized rules
 * — they show up in the palette and pass R24 by their listed abilities, which is the
 * conservative default. Suz can layer rules onto a new sister later if she ever wants.
 */
export const SEED_ROSTER: Sister[] = [
  {
    id: 'suz',
    name: 'Suz',
    abilities: ['dinner_cook', 'supper_cook', 'table_server', 'soup_maker', 'honey_fill', 'driver'],
    restrictions: [],
  },
  {
    id: 'claire',
    name: 'Claire',
    abilities: ['dinner_cook', 'table_server', 'shipping', 'honey_fill', 'driver'],
    restrictions: ['Honey fill emergency only'],
  },
  {
    id: 'ann_marie',
    name: 'Ann Marie',
    abilities: [
      'dinner_cook',
      'supper_cook',
      'table_server',
      'eucharist_setup',
      'soup_maker',
      'honey_mix',
      'garden',
    ],
    restrictions: ['Needs a driver for appointments'],
  },
  {
    id: 'karen',
    name: 'Karen',
    abilities: [
      'dinner_cook',
      'supper_cook',
      'table_server',
      'eucharist_setup',
      'shipping',
      'soup_maker',
      'honey_fill',
      'honey_labels',
      'honey_lids',
      'garden',
    ],
    restrictions: ['Prefers not to fill honey'],
  },
  {
    id: 'gertrude',
    name: 'Gertrude',
    abilities: [
      'dinner_cook',
      'supper_cook',
      'table_server',
      'eucharist_setup',
      'shipping',
      'soup_maker',
      'honey_fill',
      'honey_labels',
      'honey_lids',
      'garden',
      'driver',
    ],
    restrictions: ['Does not drive Annette'],
  },
  {
    id: 'angela_jonah',
    name: 'Angela Jonah',
    abilities: [
      'dinner_cook',
      'supper_cook',
      'table_server',
      'laundry',
      'shipping',
      'honey_fill',
      'honey_labels',
      'honey_lids',
    ],
    restrictions: ['Monday is laundry only', 'At most one cook role per week'],
  },
  {
    id: 'annette',
    name: 'Annette',
    abilities: ['supper_cook', 'ironing'],
    restrictions: ['Never cooks dinner', 'Supper at most 3×/week', 'Never on a soup day'],
  },
  {
    id: 'victoria',
    name: 'Victoria',
    abilities: ['dinner_cook', 'supper_cook', 'table_server', 'shipping'],
    restrictions: ['Needs a helper when cooking', 'Needs a driver for appointments'],
  },
  {
    id: 'kathy',
    name: 'Kathy',
    abilities: ['driver'],
    restrictions: [],
  },
];

/**
 * Live roster — starts as a copy of SEED_ROSTER and is replaced in place by
 * `rosterStore.setActiveRoster()` whenever Suz edits the sisters list. The rules
 * engine reads through `SISTER_BY_ID` (also kept in sync), so renames and additions
 * flow through to warning text and ability checks without re-importing.
 */
export const ROSTER: Sister[] = SEED_ROSTER.map((s) => ({
  ...s,
  abilities: [...s.abilities],
  restrictions: [...s.restrictions],
}));

export const SISTER_BY_ID: Record<string, Sister> = Object.fromEntries(
  ROSTER.map((s) => [s.id, s]),
);

/** Replace the live ROSTER and SISTER_BY_ID in place. Called by the roster store
 *  on initial load and after every save. Mutating in place (instead of re-exporting)
 *  means modules that imported these earlier still see the current state. */
export function applyActiveRoster(roster: Sister[]): void {
  ROSTER.length = 0;
  for (const s of roster) {
    ROSTER.push({
      ...s,
      abilities: [...s.abilities],
      restrictions: [...s.restrictions],
    });
  }
  for (const k of Object.keys(SISTER_BY_ID)) delete SISTER_BY_ID[k];
  for (const s of ROSTER) SISTER_BY_ID[s.id] = s;
}

/** Sisters who can be the helper for Victoria's cook days (R11). */
export const VICTORIA_HELPERS = ['angela_jonah', 'karen', 'ann_marie', 'claire'];

/** Sisters who set up Eucharist (R12). */
export const EUCHARIST_SETTERS = ['karen', 'gertrude', 'ann_marie'];

/** Dinner cook frequency rule (R1) applies to these sisters Mon–Sat. */
export const DINNER_COOKS = ['suz', 'claire', 'ann_marie', 'karen', 'gertrude', 'angela_jonah'];

/** Soup-maker rotation (R10) — non-Sunday soup days come from this set. */
export const SOUP_MAKERS = ['karen', 'ann_marie', 'gertrude', 'suz'];

/** Drivers available to bring Ann Marie / Victoria / Annette to appointments (R20). */
export const DRIVERS = ['kathy', 'claire', 'suz', 'gertrude'];

/** Angela Jonah is rare backup driver only (R20). */
export const BACKUP_DRIVERS = ['angela_jonah'];

/** Sisters who require a driver when they have an appointment. */
export const NEEDS_DRIVER = ['ann_marie', 'victoria', 'annette'];

/** Shipping primary (R17) and backup. */
export const SHIPPING_PRIMARY = ['claire', 'gertrude', 'karen'];
export const SHIPPING_BACKUP = ['victoria', 'angela_jonah'];

/** Honey roles (R18). */
export const HONEY_MIX_ONLY = ['ann_marie'];
export const HONEY_FILL = ['suz', 'gertrude', 'karen', 'angela_jonah'];
export const HONEY_FILL_EMERGENCY = ['claire'];
export const HONEY_LABELS = ['gertrude', 'karen', 'angela_jonah'];
export const HONEY_LIDS = ['gertrude', 'karen', 'angela_jonah'];

/** Garden, R19 (spring/summer dormant otherwise). */
export const GARDEN_HEAVY = 'ann_marie';
export const GARDEN_LIGHT = ['karen', 'gertrude'];

import type { Sister } from '../types';

/**
 * Inferred from the brief's rules. Confirm with Suz before treating as canonical.
 * Notes that are surfaced in the UI as restrictions live in `restrictions`.
 */
export const ROSTER: Sister[] = [
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

export const SISTER_BY_ID: Record<string, Sister> = Object.fromEntries(
  ROSTER.map((s) => [s.id, s]),
);

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

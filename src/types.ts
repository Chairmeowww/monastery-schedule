export type Ability =
  | 'dinner_cook'
  | 'supper_cook'
  | 'table_server'
  | 'eucharist_setup'
  | 'shipping'
  | 'soup_maker'
  | 'honey_mix'
  | 'honey_fill'
  | 'honey_labels'
  | 'honey_lids'
  | 'garden'
  | 'laundry'
  | 'ironing'
  | 'driver';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export type Slot =
  | 'dinner'
  | 'supper'
  | 'table'
  | 'eucharist'
  | 'shipping'
  | 'laundry'
  | 'ironing'
  | 'garden'
  | 'honey'
  | 'driver';

export const SLOTS: Slot[] = [
  'dinner',
  'supper',
  'table',
  'eucharist',
  'shipping',
  'laundry',
  'ironing',
  'garden',
  'honey',
  'driver',
];

export const SLOT_LABEL: Record<Slot, string> = {
  dinner: 'Dinner',
  supper: 'Supper',
  table: 'Table',
  eucharist: 'Eucharist',
  shipping: 'Shipping',
  laundry: 'Laundry',
  ironing: 'Ironing',
  garden: 'Garden',
  honey: 'Honey',
  driver: 'Driver',
};

export type Sister = {
  id: string;
  name: string;
  abilities: Ability[];
  restrictions: string[];
  isManager?: boolean;
};

export type Assignment = {
  day: DayOfWeek;
  slot: Slot;
  sisterIds: string[];
  note?: string;
};

export type Appointment = {
  sisterId: string;
  day: DayOfWeek;
  type: string;
};

export type PrivateSolitude = {
  sisterId: string;
  day: DayOfWeek;
};

export type Week = {
  weekOf: string;
  daySolitude?: DayOfWeek;
  privateSolitude: PrivateSolitude[];
  appointments: Appointment[];
  assignments: Assignment[];
  /** A note marker (rule code + day/slot key) -> dismissal note */
  dismissals: Record<string, string>;
  /** Soup days for this week — typically mon, wed (per R9). User-editable. */
  soupDays: DayOfWeek[];
};

export type ConflictSeverity = 'hard' | 'soft' | 'info';

export type Conflict = {
  rule: string;          // 'R5', 'R12', etc.
  severity: ConflictSeverity;
  message: string;       // plain English
  /** Identifies the cell/area this conflict is attached to. */
  scope: ConflictScope;
  /** Stable key used for dismissal. */
  key: string;
};

export type ConflictScope =
  | { kind: 'cell'; day: DayOfWeek; slot: Slot }
  | { kind: 'sister'; sisterId: string }
  | { kind: 'day'; day: DayOfWeek }
  | { kind: 'week' };

export type ValidationResult = {
  conflicts: Conflict[];
};

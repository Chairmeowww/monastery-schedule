import {
  DAYS,
  type Assignment,
  type Conflict,
  type DayOfWeek,
  type Sister,
  type Slot,
  type ValidationResult,
  type Week,
} from '../types';
import {
  BACKUP_DRIVERS,
  DINNER_COOKS,
  DRIVERS,
  EUCHARIST_SETTERS,
  HONEY_FILL,
  HONEY_FILL_EMERGENCY,
  HONEY_LABELS,
  HONEY_LIDS,
  HONEY_MIX_ONLY,
  NEEDS_DRIVER,
  SHIPPING_BACKUP,
  SHIPPING_PRIMARY,
  SISTER_BY_ID,
  SOUP_MAKERS,
  VICTORIA_HELPERS,
} from '../data/roster';
import { isSpringSummer, isFall } from '../data/defaults';

// ---------- helpers ----------

const NAME = (id: string) => SISTER_BY_ID[id]?.name ?? id;

function cellKey(day: DayOfWeek, slot: Slot, rule: string, suffix = ''): string {
  return `${rule}::${day}::${slot}${suffix ? `::${suffix}` : ''}`;
}

function findAssignment(week: Week, day: DayOfWeek, slot: Slot): Assignment | undefined {
  return week.assignments.find((a) => a.day === day && a.slot === slot);
}

function sistersInSlot(week: Week, day: DayOfWeek, slot: Slot): string[] {
  return findAssignment(week, day, slot)?.sisterIds ?? [];
}

function dutiesForSisterOnDay(week: Week, sisterId: string, day: DayOfWeek): Assignment[] {
  return week.assignments.filter((a) => a.day === day && a.sisterIds.includes(sisterId));
}

function countSlotForSisterMonSat(week: Week, sisterId: string, slot: Slot): number {
  return week.assignments.filter(
    (a) => a.slot === slot && a.day !== 'sun' && a.sisterIds.includes(sisterId),
  ).length;
}

function countSlotForSister(week: Week, sisterId: string, slot: Slot): number {
  return week.assignments.filter((a) => a.slot === slot && a.sisterIds.includes(sisterId)).length;
}

// ---------- rules ----------

/** R1. Each of the six dinner-cooks appears exactly once on dinner Mon–Sat.
 *  Emits a conflict on every dinner cell where the over-assigned sister appears
 *  so the warning is visible right at the cell, not just in the panel.
 */
export function R1_dinnerFrequency(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const id of DINNER_COOKS) {
    const n = countSlotForSisterMonSat(week, id, 'dinner');
    if (n <= 1) continue;
    const message = `${NAME(id)} is on dinner ${n} times Mon–Sat (should be once).`;
    for (const a of week.assignments) {
      if (a.slot !== 'dinner' || a.day === 'sun' || !a.sisterIds.includes(id)) continue;
      c.push({
        rule: 'R1',
        severity: 'hard',
        message,
        scope: { kind: 'cell', day: a.day, slot: 'dinner' },
        key: cellKey(a.day, 'dinner', 'R1', id),
      });
    }
  }
  return c;
}

/** R4. Annette never cooks dinner. Annette cooks supper at most 3×/week. */
export function R4_annette(week: Week): Conflict[] {
  const c: Conflict[] = [];
  // Never cooks dinner — flag any dinner cell containing Annette
  for (const day of DAYS) {
    if (sistersInSlot(week, day, 'dinner').includes('annette')) {
      c.push({
        rule: 'R4',
        severity: 'hard',
        message: 'Annette never cooks dinner.',
        scope: { kind: 'cell', day, slot: 'dinner' },
        key: cellKey(day, 'dinner', 'R4', 'annette'),
      });
    }
  }
  const supperCount = countSlotForSister(week, 'annette', 'supper');
  if (supperCount > 3) {
    c.push({
      rule: 'R4',
      severity: 'hard',
      message: `Annette is on supper ${supperCount}× this week (max 3).`,
      scope: { kind: 'sister', sisterId: 'annette' },
      key: 'R4::annette-supper',
    });
  }
  return c;
}

/** R5. Each table-able sister serves table once/week.
 *  Suz is the brief's sanctioned exception ("I fill in where this is not possible") — silent.
 *  Warning surfaces on each table cell where the over-assigned sister appears.
 */
export function R5_tableFrequency(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const counts: Record<string, number> = {};
  for (const a of week.assignments) {
    if (a.slot !== 'table') continue;
    for (const id of a.sisterIds) counts[id] = (counts[id] ?? 0) + 1;
  }
  for (const [id, n] of Object.entries(counts)) {
    if (n <= 1) continue;
    if (id === 'suz') continue; // sanctioned exception per the brief
    const message = `${NAME(id)} is on table service ${n}× this week (usually once).`;
    for (const a of week.assignments) {
      if (a.slot !== 'table' || !a.sisterIds.includes(id)) continue;
      c.push({
        rule: 'R5',
        severity: 'soft',
        message,
        scope: { kind: 'cell', day: a.day, slot: 'table' },
        key: cellKey(a.day, 'table', 'R5', id),
      });
    }
  }
  return c;
}

/** R6. Angela Jonah cooks at most once per week (dinner OR supper).
 *  Surfaces on every cooking cell where AJ appears once she crosses the threshold.
 */
export function R6_angelaJonahCook(week: Week): Conflict[] {
  const cooks = week.assignments.filter(
    (a) => (a.slot === 'dinner' || a.slot === 'supper') && a.sisterIds.includes('angela_jonah'),
  );
  if (cooks.length <= 1) return [];
  const message = `Angela Jonah is cooking ${cooks.length}× this week (max once: dinner OR supper).`;
  return cooks.map((a) => ({
    rule: 'R6',
    severity: 'hard',
    message,
    scope: { kind: 'cell', day: a.day, slot: a.slot },
    key: cellKey(a.day, a.slot, 'R6'),
  }));
}

/** R7. Annette never makes soup; never assigned to a soup day's supper. */
export function R7_annetteSoup(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const day of week.soupDays) {
    if (sistersInSlot(week, day, 'supper').includes('annette')) {
      c.push({
        rule: 'R7',
        severity: 'hard',
        message: 'Annette is on supper on a soup day — Annette does not make soup.',
        scope: { kind: 'cell', day, slot: 'supper' },
        key: cellKey(day, 'supper', 'R7'),
      });
    }
  }
  return c;
}

/** R8. Sunday supper or lunch always has soup — meaning a Sunday meal is a soup meal.
 *  Treats "Sunday supper" as carrying the soup obligation. If Sunday supper has no cook,
 *  flag missing soup. (Phase 1: assumes Sunday's `dinner` is the midday "lunch.")
 */
export function R8_sundaySoup(week: Week): Conflict[] {
  // Soft until we have richer Sunday data — at minimum flag if Sun supper unassigned and Sun isn't a soup day.
  if (week.soupDays.includes('sun')) return [];
  const sunSupper = sistersInSlot(week, 'sun', 'supper');
  const sunDinner = sistersInSlot(week, 'sun', 'dinner');
  if (sunSupper.length === 0 && sunDinner.length === 0) {
    return [
      {
        rule: 'R8',
        severity: 'soft',
        message: 'Sunday supper or lunch should include soup.',
        scope: { kind: 'day', day: 'sun' },
        key: 'R8::sun-soup',
      },
    ];
  }
  return [];
}

/** R9. Best soup days are Mon and Wed. Other soup days warn. */
export function R9_soupDayPreferred(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const day of week.soupDays) {
    if (day === 'mon' || day === 'wed' || day === 'sun') continue;
    c.push({
      rule: 'R9',
      severity: 'soft',
      message: 'Soup is typically made on Monday or Wednesday.',
      scope: { kind: 'day', day },
      key: `R9::${day}`,
    });
  }
  return c;
}

/** R10. On every soup day, the supper cook must be in the soup-makers set. */
export function R10_soupMaker(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const day of week.soupDays) {
    const supperCooks = sistersInSlot(week, day, 'supper');
    if (supperCooks.length === 0) continue; // R8 / cell-empty handles this
    for (const id of supperCooks) {
      if (!SOUP_MAKERS.includes(id)) {
        c.push({
          rule: 'R10',
          severity: 'hard',
          message: `${NAME(id)} is on supper on a soup day but isn't a soup maker.`,
          scope: { kind: 'cell', day, slot: 'supper' },
          key: cellKey(day, 'supper', 'R10', id),
        });
      }
    }
  }
  // Soup-makers collectively cook supper at least 2×/week — only nudge once supper is being scheduled
  const anySupper = week.assignments.some((a) => a.slot === 'supper');
  if (anySupper) {
    const supperCountForMakers = week.assignments
      .filter((a) => a.slot === 'supper')
      .flatMap((a) => a.sisterIds)
      .filter((id) => SOUP_MAKERS.includes(id)).length;
    if (supperCountForMakers < 2) {
      c.push({
        rule: 'R10',
        severity: 'soft',
        message: 'Soup makers (Karen, Ann Marie, Gertrude, Suz) usually cook supper at least 2× a week.',
        scope: { kind: 'week' },
        key: 'R10::min-2',
      });
    }
  }
  return c;
}

/** R11. Victoria cooking requires a helper from {Angela Jonah, Karen, Ann Marie, Claire}. */
export function R11_victoriaHelper(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const a of week.assignments) {
    if ((a.slot !== 'dinner' && a.slot !== 'supper') || !a.sisterIds.includes('victoria')) continue;
    const others = a.sisterIds.filter((id) => id !== 'victoria');
    const hasHelper = others.some((id) => VICTORIA_HELPERS.includes(id));
    if (!hasHelper) {
      c.push({
        rule: 'R11',
        severity: 'hard',
        message: 'Victoria is cooking — needs a helper (Angela Jonah, Karen, Ann Marie, or Claire).',
        scope: { kind: 'cell', day: a.day, slot: a.slot },
        key: cellKey(a.day, a.slot, 'R11'),
      });
    }
  }
  return c;
}

/** R12. Eucharist setters are Karen/Gertrude/Ann Marie. Cannot set Eucharist if also supper cook Tue or Wed. */
export function R12_eucharist(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const a of week.assignments) {
    if (a.slot !== 'eucharist') continue;
    for (const id of a.sisterIds) {
      if (!EUCHARIST_SETTERS.includes(id)) {
        c.push({
          rule: 'R12',
          severity: 'hard',
          message: `${NAME(id)} doesn't set up Eucharist.`,
          scope: { kind: 'cell', day: a.day, slot: 'eucharist' },
          key: cellKey(a.day, 'eucharist', 'R12', `bad-${id}`),
        });
        continue;
      }
      // also-supper-cook conflict
      if (a.day === 'tue' || a.day === 'wed') {
        const supperCooks = sistersInSlot(week, a.day, 'supper');
        if (supperCooks.includes(id)) {
          c.push({
            rule: 'R12',
            severity: 'hard',
            message: `${NAME(id)} is supper cook on ${a.day === 'tue' ? 'Tuesday' : 'Wednesday'} — can't also set Eucharist.`,
            scope: { kind: 'cell', day: a.day, slot: 'eucharist' },
            key: cellKey(a.day, 'eucharist', 'R12', `clash-${id}`),
          });
        }
      }
    }
  }
  return c;
}

/** R13. Eucharist setter cannot be dinner cook on day of solitude or Saturday. */
export function R13_eucharistDinnerClash(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const a of week.assignments) {
    if (a.slot !== 'eucharist') continue;
    for (const id of a.sisterIds) {
      const conflictDays: DayOfWeek[] = ['sat'];
      if (week.daySolitude && !conflictDays.includes(week.daySolitude)) {
        conflictDays.push(week.daySolitude);
      }
      for (const d of conflictDays) {
        if (sistersInSlot(week, d, 'dinner').includes(id)) {
          c.push({
            rule: 'R13',
            severity: 'hard',
            message: `${NAME(id)} is dinner cook on ${d === 'sat' ? 'Saturday' : 'day of solitude'} — can't also set Eucharist.`,
            scope: { kind: 'cell', day: a.day, slot: 'eucharist' },
            key: cellKey(a.day, 'eucharist', 'R13', `${id}-${d}`),
          });
        }
      }
    }
  }
  return c;
}

/** R14. Angela Jonah's Monday is laundry only.
 *  HARD: any non-laundry duty on Monday for AJ.
 *  SOFT: AJ not on Mon laundry at all (her standing role).
 */
export function R14_angelaJonahMonday(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const aj = dutiesForSisterOnDay(week, 'angela_jonah', 'mon').filter((a) => a.slot !== 'laundry');
  for (const dup of aj) {
    c.push({
      rule: 'R14',
      severity: 'hard',
      message: 'Angela Jonah’s Monday is laundry only.',
      scope: { kind: 'cell', day: 'mon', slot: dup.slot },
      key: cellKey('mon', dup.slot, 'R14'),
    });
  }
  const onMonLaundry = sistersInSlot(week, 'mon', 'laundry').includes('angela_jonah');
  if (!onMonLaundry) {
    c.push({
      rule: 'R14',
      severity: 'soft',
      message: 'Angela Jonah usually has Monday for laundry.',
      scope: { kind: 'cell', day: 'mon', slot: 'laundry' },
      key: cellKey('mon', 'laundry', 'R14', 'aj-missing'),
    });
  }
  return c;
}

/** R15. Angela Jonah does at least one additional laundry period beyond Monday.
 *  Soft: it's a TODO reminder, not a wrong-thing-assigned mistake.
 */
export function R15_angelaJonahLaundry(week: Week): Conflict[] {
  const laundry = week.assignments.filter(
    (a) => a.slot === 'laundry' && a.sisterIds.includes('angela_jonah'),
  );
  if (laundry.length < 2) {
    return [
      {
        rule: 'R15',
        severity: 'soft',
        message: 'Angela Jonah needs at least one more laundry period beyond Monday.',
        scope: { kind: 'sister', sisterId: 'angela_jonah' },
        key: 'R15::aj-laundry',
      },
    ];
  }
  return [];
}

/** R16. Annette's ironing belongs on Tue or Wed.
 *  Silent if she's off ironing entirely (it's optional).
 *  Soft warn if she's on ironing on any day other than Tue/Wed.
 */
export function R16_annetteIroning(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const annetteIroning = week.assignments.filter(
    (a) => a.slot === 'ironing' && a.sisterIds.includes('annette'),
  );
  for (const a of annetteIroning) {
    if (a.day === 'tue' || a.day === 'wed') continue;
    c.push({
      rule: 'R16',
      severity: 'soft',
      message: `Annette typically irons on Tuesday or Wednesday — not ${dayHuman(a.day)}.`,
      scope: { kind: 'cell', day: a.day, slot: 'ironing' },
      key: cellKey(a.day, 'ironing', 'R16', 'wrong-day'),
    });
  }
  return c;
}

/** R17. Shipping Mon–Thu: primary shippers are silent, backups soft-warn (emergency only),
 *  anyone else is hard-flagged.
 */
export function R17_shipping(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const primary = new Set(SHIPPING_PRIMARY);
  const backup = new Set(SHIPPING_BACKUP);
  for (const day of ['mon', 'tue', 'wed', 'thu'] as DayOfWeek[]) {
    const ids = sistersInSlot(week, day, 'shipping');
    if (ids.length === 0) {
      c.push({
        rule: 'R17',
        severity: 'soft',
        message: 'Shipping still needs to be assigned.',
        scope: { kind: 'cell', day, slot: 'shipping' },
        key: cellKey(day, 'shipping', 'R17', 'empty'),
      });
      continue;
    }
    for (const id of ids) {
      if (primary.has(id)) continue;
      if (backup.has(id)) {
        c.push({
          rule: 'R17',
          severity: 'soft',
          message: `${NAME(id)} is a backup shipper — usually only in an emergency.`,
          scope: { kind: 'cell', day, slot: 'shipping' },
          key: cellKey(day, 'shipping', 'R17', `backup-${id}`),
        });
        continue;
      }
      c.push({
        rule: 'R17',
        severity: 'hard',
        message: `${NAME(id)} doesn't do shipping.`,
        scope: { kind: 'cell', day, slot: 'shipping' },
        key: cellKey(day, 'shipping', 'R17', id),
      });
    }
  }
  return c;
}

/** R18. Honey rules — at least once/week (HARD); per-job role validation when the cell's honeyJob is set.
 *  In Fall (Sep 23 – Nov 30) the brief says honey activity picks up — soft-nudge if only one period.
 */
export function R18_honey(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const honey = week.assignments.filter((a) => a.slot === 'honey');
  if (honey.length === 0) {
    c.push({
      rule: 'R18',
      severity: 'soft',
      message: 'Honey still needs to be scheduled this week.',
      scope: { kind: 'week' },
      key: 'R18::missing',
    });
  } else if (honey.length < 2 && isFall(week.weekOf)) {
    c.push({
      rule: 'R18',
      severity: 'soft',
      message: 'Honey is typically scheduled more than once in Fall.',
      scope: { kind: 'week' },
      key: 'R18::fall-frequency',
    });
  }

  for (const a of honey) {
    // If no honey job is picked, fall back to "is this person on the honey crew at all" check
    // and a soft nudge to pick a job so we can validate properly.
    if (!a.honeyJob) {
      const allValid = [
        ...HONEY_MIX_ONLY,
        ...HONEY_FILL,
        ...HONEY_LABELS,
        ...HONEY_LIDS,
        ...HONEY_FILL_EMERGENCY,
      ];
      for (const id of a.sisterIds) {
        if (!allValid.includes(id)) {
          c.push({
            rule: 'R18',
            severity: 'hard',
            message: `${NAME(id)} isn't on the honey crew.`,
            scope: { kind: 'cell', day: a.day, slot: 'honey' },
            key: cellKey(a.day, 'honey', 'R18', `bad-${id}`),
          });
        }
      }
      if (a.sisterIds.length > 0) {
        c.push({
          rule: 'R18',
          severity: 'soft',
          message: 'Pick which honey job (Mix / Fill / Labels / Lids) so it can be validated.',
          scope: { kind: 'cell', day: a.day, slot: 'honey' },
          key: cellKey(a.day, 'honey', 'R18', 'job-unset'),
        });
      }
      continue;
    }

    // honeyJob is set — validate each sister against that job's ability list.
    const job = a.honeyJob;
    const allowedForJob: Record<typeof job, string[]> = {
      Mix: HONEY_MIX_ONLY,
      Fill: [...HONEY_FILL, ...HONEY_FILL_EMERGENCY],
      Labels: HONEY_LABELS,
      Lids: HONEY_LIDS,
    };
    for (const id of a.sisterIds) {
      if (!allowedForJob[job].includes(id)) {
        c.push({
          rule: 'R18',
          severity: 'hard',
          message: `${NAME(id)} doesn't do honey ${job.toLowerCase()}.`,
          scope: { kind: 'cell', day: a.day, slot: 'honey' },
          key: cellKey(a.day, 'honey', 'R18', `bad-${job}-${id}`),
        });
        continue;
      }
      if (job === 'Fill' && id === 'karen') {
        c.push({
          rule: 'R18',
          severity: 'soft',
          message: 'Karen prefers not to fill honey jars.',
          scope: { kind: 'cell', day: a.day, slot: 'honey' },
          key: cellKey(a.day, 'honey', 'R18', 'karen-fill-pref'),
        });
      }
      if (job === 'Fill' && id === 'claire') {
        c.push({
          rule: 'R18',
          severity: 'soft',
          message: 'Claire fills honey only in an emergency.',
          scope: { kind: 'cell', day: a.day, slot: 'honey' },
          key: cellKey(a.day, 'honey', 'R18', 'claire-fill-emergency'),
        });
      }
    }
  }
  return c;
}

/** R19. Garden in spring/summer: Ann Marie 3× HARD; Karen 1× SOFT; Gertrude 1× SOFT.
 *  Off-season dormant. Karen/Gertrude soft warns only fire once garden scheduling has begun.
 */
export function R19_garden(week: Week): Conflict[] {
  if (!isSpringSummer(week.weekOf)) return [];
  const c: Conflict[] = [];
  const garden = week.assignments.filter((a) => a.slot === 'garden');
  const counts = (id: string) => garden.filter((a) => a.sisterIds.includes(id)).length;
  const am = counts('ann_marie');
  if (am < 3) {
    c.push({
      rule: 'R19',
      severity: 'soft',
      message: `Ann Marie usually gardens 3× a week in season (currently ${am}).`,
      scope: { kind: 'sister', sisterId: 'ann_marie' },
      key: 'R19::am',
    });
  }
  // Only nag about Karen/Gertrude after garden scheduling has begun for the week.
  if (garden.length > 0) {
    const k = counts('karen');
    if (k < 1) {
      c.push({
        rule: 'R19',
        severity: 'soft',
        message: 'Karen usually gardens once a week in season.',
        scope: { kind: 'sister', sisterId: 'karen' },
        key: 'R19::karen',
      });
    }
    const g = counts('gertrude');
    if (g < 1) {
      c.push({
        rule: 'R19',
        severity: 'soft',
        message: 'Gertrude usually gardens once a week in season.',
        scope: { kind: 'sister', sisterId: 'gertrude' },
        key: 'R19::gertrude',
      });
    }
  }
  return c;
}

/** R20. Doctor appointments require a driver (with exclusions). */
export function R20_driverForAppointment(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const appt of week.appointments) {
    if (!NEEDS_DRIVER.includes(appt.sisterId)) continue;
    const driverCell = findAssignment(week, appt.day, 'driver');
    const drivers = driverCell?.sisterIds ?? [];
    const validDrivers = drivers.filter(
      (id) => DRIVERS.includes(id) || BACKUP_DRIVERS.includes(id),
    );
    if (validDrivers.length === 0) {
      c.push({
        rule: 'R20',
        severity: 'hard',
        message: `${NAME(appt.sisterId)} has an appointment — needs a driver.`,
        scope: { kind: 'cell', day: appt.day, slot: 'driver' },
        key: `R20::${appt.day}::${appt.sisterId}`,
      });
    }
    // Specific exclusion: Gertrude does NOT drive Annette
    if (appt.sisterId === 'annette' && drivers.includes('gertrude')) {
      c.push({
        rule: 'R20',
        severity: 'hard',
        message: 'Gertrude does not drive Annette.',
        scope: { kind: 'cell', day: appt.day, slot: 'driver' },
        key: `R20::${appt.day}::gertrude-annette`,
      });
    }
  }
  return c;
}

/** R21. A sister with an appointment that day has no other duty that day. */
export function R21_appointmentClearsDay(week: Week): Conflict[] {
  const c: Conflict[] = [];
  for (const appt of week.appointments) {
    const others = dutiesForSisterOnDay(week, appt.sisterId, appt.day).filter(
      (a) => a.slot !== 'driver',
    );
    for (const a of others) {
      c.push({
        rule: 'R21',
        severity: 'hard',
        message: `${NAME(appt.sisterId)} has a doctor appointment ${dayHuman(appt.day)} — no other duty that day.`,
        scope: { kind: 'cell', day: a.day, slot: a.slot },
        key: cellKey(a.day, a.slot, 'R21', appt.sisterId),
      });
    }
  }
  return c;
}

/** R23. Cook on community day of solitude is also that day's table server.
 *  Soft-warn if the dinner cook on DoS isn't on the table for that day too.
 */
export function R23_dosCookAlsoTable(week: Week): Conflict[] {
  if (!week.daySolitude) return [];
  const day = week.daySolitude;
  const dinnerCooks = sistersInSlot(week, day, 'dinner');
  if (dinnerCooks.length === 0) return [];
  const tableServers = sistersInSlot(week, day, 'table');
  const c: Conflict[] = [];
  for (const cook of dinnerCooks) {
    if (tableServers.includes(cook)) continue;
    c.push({
      rule: 'R23',
      severity: 'soft',
      message: `${NAME(cook)} cooks on day of solitude — usually also serves table that day.`,
      scope: { kind: 'cell', day, slot: 'table' },
      key: cellKey(day, 'table', 'R23', `cook-${cook}`),
    });
  }
  return c;
}

/** R22. No sister appears in two job slots on the same day. (The flagship rule.) */
export function R22_sameDayDouble(week: Week): Conflict[] {
  const c: Conflict[] = [];
  const seenKeys = new Set<string>();
  // Group assignments by day → sister
  const byDaySister: Record<string, Set<string>> = {};
  for (const a of week.assignments) {
    for (const id of a.sisterIds) {
      const k = `${a.day}::${id}`;
      if (!byDaySister[k]) byDaySister[k] = new Set();
      byDaySister[k].add(a.slot);
    }
  }
  for (const [k, slots] of Object.entries(byDaySister)) {
    if (slots.size <= 1) continue;
    const [day, id] = k.split('::') as [DayOfWeek, string];
    // Allowed combo exception: appointment-driver pair is handled by R21; honey + other isn't allowed either.
    for (const slot of slots) {
      const slotTyped = slot as Slot;
      const dedup = `R22::${day}::${id}::${slotTyped}`;
      if (seenKeys.has(dedup)) continue;
      seenKeys.add(dedup);
      c.push({
        rule: 'R22',
        severity: 'hard',
        message: `${NAME(id)} is in ${slots.size} jobs on ${dayHuman(day)}.`,
        scope: { kind: 'cell', day, slot: slotTyped },
        key: dedup,
      });
    }
  }
  return c;
}

function dayHuman(d: DayOfWeek): string {
  return ({
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  } as const)[d];
}

// ---------- aggregator ----------

export const ALL_RULES = [
  R1_dinnerFrequency,
  R4_annette,
  R5_tableFrequency,
  R6_angelaJonahCook,
  R7_annetteSoup,
  R8_sundaySoup,
  R9_soupDayPreferred,
  R10_soupMaker,
  R11_victoriaHelper,
  R12_eucharist,
  R13_eucharistDinnerClash,
  R14_angelaJonahMonday,
  R15_angelaJonahLaundry,
  R16_annetteIroning,
  R17_shipping,
  R18_honey,
  R19_garden,
  R20_driverForAppointment,
  R21_appointmentClearsDay,
  R22_sameDayDouble,
  R23_dosCookAlsoTable,
];

export function validateWeek(week: Week, _roster?: Sister[]): ValidationResult {
  const conflicts: Conflict[] = [];
  for (const rule of ALL_RULES) conflicts.push(...rule(week));
  return { conflicts };
}

import { describe, it, expect } from 'vitest';
import type { Assignment, DayOfWeek, Week } from '../types';
import { freshWeek } from '../data/defaults';
import { validateWeek } from './index';

const baseWeekOf = '2026-01-05'; // a Monday in winter (R19 dormant)

function emptyValidWeek(): Week {
  // Build a "clean" week using a bijection that doesn't clash with standing pattern.
  // Standing: table (suz mon, gertrude tue, victoria wed, suz thu, claire fri, aj sat, ann_marie sun);
  //           shipping (claire mon, gertrude tue, karen wed, claire thu);
  //           AJ laundry mon.
  // Override shipping rotation here to avoid Tue/Wed conflicts with the table standing.
  const w = freshWeek(baseWeekOf);
  // freshWeek now returns empty until the user saves a standing pattern. The §11
  // tests assume the brief's defaults (table standing, AJ Mon laundry, soup days), so
  // we set them up explicitly here.
  w.soupDays = ['mon', 'wed', 'sun'];
  w.assignments = [
    { day: 'mon', slot: 'table', sisterIds: ['suz'] },
    { day: 'tue', slot: 'table', sisterIds: ['gertrude'] },
    { day: 'wed', slot: 'table', sisterIds: ['victoria'] },
    { day: 'thu', slot: 'table', sisterIds: ['suz'] },
    { day: 'fri', slot: 'table', sisterIds: ['claire'] },
    { day: 'sat', slot: 'table', sisterIds: ['angela_jonah'] },
    { day: 'sun', slot: 'table', sisterIds: ['ann_marie'] },
    { day: 'mon', slot: 'laundry', sisterIds: ['angela_jonah'] },
  ];
  // Shipping rotation chosen to dodge Tue/Wed table standing
  w.assignments.push({ day: 'mon', slot: 'shipping', sisterIds: ['claire'] });
  w.assignments.push({ day: 'tue', slot: 'shipping', sisterIds: ['karen'] });
  w.assignments.push({ day: 'wed', slot: 'shipping', sisterIds: ['gertrude'] });
  w.assignments.push({ day: 'thu', slot: 'shipping', sisterIds: ['claire'] });

  // Dinner Mon–Sat — bijection chosen to dodge standing duties
  const dinnerByDay: Record<DayOfWeek, string> = {
    mon: 'ann_marie',
    tue: 'suz',
    wed: 'claire',
    thu: 'karen',
    fri: 'angela_jonah',
    sat: 'gertrude',
    sun: '',
  };
  for (const [day, id] of Object.entries(dinnerByDay)) {
    if (!id) continue;
    w.assignments.push({ day: day as DayOfWeek, slot: 'dinner', sisterIds: [id] });
  }
  // Sunday dinner repeats one of the cooks (R2 — expected)
  w.assignments.push({ day: 'sun', slot: 'dinner', sisterIds: ['suz'] });
  // Soup days mon, wed → supper cooks come from soup makers
  w.assignments.push({ day: 'mon', slot: 'supper', sisterIds: ['karen'] });
  w.assignments.push({ day: 'wed', slot: 'supper', sisterIds: ['ann_marie'] });
  // Eucharist Friday — Karen is dinner Thu (R13 OK), not Tue/Wed supper (R12 OK)
  w.assignments.push({ day: 'fri', slot: 'eucharist', sisterIds: ['karen'] });
  // Angela Jonah second laundry (R15)
  w.assignments.push({ day: 'thu', slot: 'laundry', sisterIds: ['angela_jonah'] });
  // Honey at least once
  w.assignments.push({ day: 'fri', slot: 'honey', sisterIds: ['ann_marie'] });
  return w;
}

function withAssignment(w: Week, a: Assignment): Week {
  return { ...w, assignments: [...w.assignments, a] };
}

describe('validators (§11 acceptance scenarios)', () => {
  it('1. Gertrude double-booked Friday: R5 (table 2x) and R22 fire', () => {
    let w = emptyValidWeek();
    // Gertrude already serves Tue (standing). Adding Wed and Fri table.
    w = withAssignment(w, { day: 'wed', slot: 'table', sisterIds: ['gertrude'] });
    w = withAssignment(w, { day: 'fri', slot: 'table', sisterIds: ['gertrude'] });
    // And another duty Friday so R22 is unambiguous
    // (Gertrude already has eucharist Fri in the base, so R22 should fire on Fri)
    const { conflicts } = validateWeek(w);
    const rules = conflicts.map((c) => c.rule);
    expect(rules).toContain('R5');
    expect(rules).toContain('R22');
  });

  it('2. Annette assigned to soup-day supper → R7 fires', () => {
    let w = emptyValidWeek();
    // Replace Mon supper (a soup day) with Annette
    w = {
      ...w,
      assignments: w.assignments.filter(
        (a) => !(a.day === 'mon' && a.slot === 'supper'),
      ),
    };
    w = withAssignment(w, { day: 'mon', slot: 'supper', sisterIds: ['annette'] });
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R7')).toBe(true);
  });

  it('3. Eucharist conflict: Karen Eucharist Wed AND supper cook Wed → R12', () => {
    let w = emptyValidWeek();
    // Replace Wed supper with Karen (still a soup maker so R10 OK)
    w = {
      ...w,
      assignments: w.assignments.filter(
        (a) => !(a.day === 'wed' && a.slot === 'supper'),
      ),
    };
    w = withAssignment(w, { day: 'wed', slot: 'supper', sisterIds: ['karen'] });
    w = withAssignment(w, { day: 'wed', slot: 'eucharist', sisterIds: ['karen'] });
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R12')).toBe(true);
  });

  it('4. Victoria as cook with no helper → R11', () => {
    let w = emptyValidWeek();
    w = withAssignment(w, { day: 'tue', slot: 'dinner', sisterIds: ['victoria'] });
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R11')).toBe(true);
  });

  it('5. Doctor appointment without driver → R20', () => {
    let w = emptyValidWeek();
    w = { ...w, appointments: [{ sisterId: 'ann_marie', day: 'thu', type: 'Dr.' }] };
    // Ann Marie's own duties Thu need to be cleared (R21) — remove her standing entries
    w = {
      ...w,
      assignments: w.assignments.filter(
        (a) => !(a.day === 'thu' && a.sisterIds.includes('ann_marie')),
      ),
    };
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R20')).toBe(true);
  });

  it('6. Gertrude driving Annette → R20', () => {
    let w = emptyValidWeek();
    w = { ...w, appointments: [{ sisterId: 'annette', day: 'thu', type: 'Dr.' }] };
    w = withAssignment(w, { day: 'thu', slot: 'driver', sisterIds: ['gertrude'] });
    // Clear Annette's other Thu duties
    w = {
      ...w,
      assignments: w.assignments.filter(
        (a) => !(a.day === 'thu' && a.sisterIds.includes('annette')),
      ),
    };
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R20' && c.message.includes('Gertrude'))).toBe(true);
  });

  it('7. Angela Jonah non-laundry duty Monday → R14', () => {
    let w = emptyValidWeek();
    w = withAssignment(w, { day: 'mon', slot: 'shipping', sisterIds: ['angela_jonah'] });
    const { conflicts } = validateWeek(w);
    expect(conflicts.some((c) => c.rule === 'R14')).toBe(true);
  });

  it('8. Clean week (winter, all cells valid) — zero hard conflicts', () => {
    const w = emptyValidWeek();
    const { conflicts } = validateWeek(w);
    const hard = conflicts.filter((c) => c.severity === 'hard');
    expect(hard).toEqual([]);
  });
});

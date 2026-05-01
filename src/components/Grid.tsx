import {
  DAYS,
  DAY_SHORT,
  SLOTS,
  SLOT_LABEL,
  type Conflict,
  type DayOfWeek,
  type Sister,
  type Slot,
  type Week,
} from '../types';
import { Cell } from './Cell';

type Props = {
  week: Week;
  conflicts: Conflict[];
  rosterById: Record<string, Sister>;
  selectedSisterId: string | null;
  onAssign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onUnassign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onDismissConflict: (key: string) => void;
  onCellNotePrompt: (day: DayOfWeek, slot: Slot) => void;
};

function dayHumanShort(d: DayOfWeek, week: Week): string {
  const base = DAY_SHORT[d];
  const isSolitude = week.daySolitude === d;
  return isSolitude ? `${base} · solitude` : base;
}

function dayAppointmentsLabel(d: DayOfWeek, week: Week, rosterById: Record<string, Sister>): string {
  const appts = week.appointments.filter((a) => a.day === d);
  if (appts.length === 0) return '';
  return appts
    .map((a) => {
      const name = rosterById[a.sisterId]?.name ?? a.sisterId;
      const type = a.type ? a.type : 'appt';
      return `${name} · ${type}`;
    })
    .join(', ');
}

export function Grid({
  week,
  conflicts,
  rosterById,
  selectedSisterId,
  onAssign,
  onUnassign,
  onDismissConflict,
  onCellNotePrompt,
}: Props) {
  const cellConflicts = (day: DayOfWeek, slot: Slot) =>
    conflicts.filter(
      (c) => c.scope.kind === 'cell' && c.scope.day === day && c.scope.slot === slot,
    );

  return (
    <div className="grid">
      <div className="head" />
      {DAYS.map((d) => {
        const appts = dayAppointmentsLabel(d, week, rosterById);
        return (
          <div
            key={d}
            className={`head ${d === 'sun' ? 'sunday-divider' : ''}`}
          >
            {dayHumanShort(d, week)}
            {appts && <span className="day-appointments" title="Appointments today">{appts}</span>}
          </div>
        );
      })}
      {SLOTS.map((slot) => (
        <SlotRow
          key={slot}
          slot={slot}
          week={week}
          rosterById={rosterById}
          selectedSisterId={selectedSisterId}
          cellConflicts={cellConflicts}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onDismissConflict={onDismissConflict}
          onCellNotePrompt={onCellNotePrompt}
        />
      ))}
    </div>
  );
}

function SlotRow({
  slot,
  week,
  rosterById,
  selectedSisterId,
  cellConflicts,
  onAssign,
  onUnassign,
  onDismissConflict,
  onCellNotePrompt,
}: {
  slot: Slot;
  week: Week;
  rosterById: Record<string, Sister>;
  selectedSisterId: string | null;
  cellConflicts: (day: DayOfWeek, slot: Slot) => Conflict[];
  onAssign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onUnassign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onDismissConflict: (key: string) => void;
  onCellNotePrompt: (day: DayOfWeek, slot: Slot) => void;
}) {
  return (
    <>
      <div className="row-label">{SLOT_LABEL[slot]}</div>
      {DAYS.map((day) => {
        const a = week.assignments.find((x) => x.day === day && x.slot === slot);
        return (
          <Cell
            key={day}
            day={day}
            slot={slot}
            sisterIds={a?.sisterIds ?? []}
            note={a?.note}
            conflicts={cellConflicts(day, slot)}
            dismissals={week.dismissals}
            rosterById={rosterById}
            selectedSisterId={selectedSisterId}
            isSundayDivider={day === 'sun'}
            isLastColumn={day === 'sun'}
            onAssign={onAssign}
            onUnassign={onUnassign}
            onDismissConflict={onDismissConflict}
            onCellNotePrompt={onCellNotePrompt}
          />
        );
      })}
    </>
  );
}

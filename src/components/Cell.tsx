import type { Conflict, DayOfWeek, Sister, Slot } from '../types';
import { SisterChip } from './SisterChip';

type Props = {
  day: DayOfWeek;
  slot: Slot;
  sisterIds: string[];
  note?: string;
  conflicts: Conflict[];
  dismissals: Record<string, string>;
  rosterById: Record<string, Sister>;
  selectedSisterId: string | null;
  isSundayDivider?: boolean;
  isLastColumn?: boolean;
  dimmed?: boolean;
  onAssign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onUnassign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onDismissConflict: (key: string) => void;
  onCellNotePrompt: (day: DayOfWeek, slot: Slot) => void;
  onEmptyCellClick?: () => void;
};

export function Cell({
  day,
  slot,
  sisterIds,
  note,
  conflicts,
  dismissals,
  rosterById,
  selectedSisterId,
  isSundayDivider,
  isLastColumn,
  dimmed,
  onAssign,
  onUnassign,
  onDismissConflict,
  onCellNotePrompt,
  onEmptyCellClick,
}: Props) {
  const hasHard = conflicts.some((c) => c.severity === 'hard' && !dismissals[c.key]);
  const hasSoft =
    !hasHard && conflicts.some((c) => c.severity === 'soft' && !dismissals[c.key]);

  const cls = [
    'cell',
    isSundayDivider ? 'sunday-divider' : '',
    isLastColumn ? 'last' : '',
    selectedSisterId && !sisterIds.includes(selectedSisterId) ? 'target' : '',
    hasHard ? 'has-conflict' : '',
    hasSoft ? 'has-soft' : '',
    dimmed ? 'dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCellClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.chip') || target.closest('.conflict')) return;
    if (!selectedSisterId) {
      onEmptyCellClick?.();
      return;
    }
    if (sisterIds.includes(selectedSisterId)) {
      onUnassign(day, slot, selectedSisterId);
    } else {
      onAssign(day, slot, selectedSisterId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onCellNotePrompt(day, slot);
  };

  return (
    <div
      className={cls}
      data-day={day}
      data-slot={slot}
      onClick={handleCellClick}
      onContextMenu={handleContextMenu}
      title={selectedSisterId ? 'Click to assign here' : 'Right-click to add a note'}
    >
      <div className="chips">
        {sisterIds.map((id) => {
          const s = rosterById[id];
          if (!s) return null;
          return (
            <SisterChip
              key={id}
              sister={s}
              assignedHere
              tip="Click to remove"
              onClick={() => onUnassign(day, slot, id)}
            />
          );
        })}
      </div>
      {note && <span className="cell-note">— {note}</span>}
      {conflicts.map((c) => {
        const dismissed = dismissals[c.key];
        return (
          <span
            key={c.key}
            className={`conflict ${c.severity} ${dismissed ? 'dismissed' : ''}`}
            title={`${c.rule}${dismissed ? ` — dismissed: ${dismissed}` : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onDismissConflict(c.key);
            }}
          >
            {c.severity === 'soft' ? 'Soft. ' : ''}
            {c.message}
          </span>
        );
      })}
    </div>
  );
}

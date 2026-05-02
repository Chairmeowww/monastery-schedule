import { useState } from 'react';
import { HONEY_JOBS, type Conflict, type DayOfWeek, type HoneyJob, type Sister, type Slot } from '../types';
import { SisterChip } from './SisterChip';

type Props = {
  day: DayOfWeek;
  slot: Slot;
  sisterIds: string[];
  note?: string;
  honeyJob?: HoneyJob;
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
  onSetHoneyJob?: (day: DayOfWeek, job: HoneyJob | null) => void;
  onEmptyCellClick?: () => void;
};

export function Cell({
  day,
  slot,
  sisterIds,
  note,
  honeyJob,
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
  onSetHoneyJob,
  onEmptyCellClick,
}: Props) {
  const [honeyPickerOpen, setHoneyPickerOpen] = useState(false);
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
    if (target.closest('.chip')) return;
    // When no sister is being placed, the conflict span owns its own click (toggle dismissal).
    // When a sister IS selected, conflict text must not block placement — let it through.
    if (!selectedSisterId) {
      if (target.closest('.conflict')) return;
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
      {slot === 'honey' && sisterIds.length > 0 && onSetHoneyJob && (
        <div className="honey-job no-print" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`honey-job-trigger ${honeyJob ? 'set' : 'unset'}`}
            onClick={() => setHoneyPickerOpen((v) => !v)}
            title="Pick which honey job"
          >
            {honeyJob ? `Job: ${honeyJob}` : 'Pick job'}
          </button>
          {honeyPickerOpen && (
            <div className="honey-job-picker">
              {HONEY_JOBS.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={honeyJob === j ? 'selected' : ''}
                  onClick={() => {
                    onSetHoneyJob(day, j);
                    setHoneyPickerOpen(false);
                  }}
                >
                  {j}
                </button>
              ))}
              {honeyJob && (
                <button
                  type="button"
                  className="clear"
                  onClick={() => {
                    onSetHoneyJob(day, null);
                    setHoneyPickerOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {conflicts.map((c) => {
        // Dismissed conflicts stay accessible in the top "Show all conflicts and warnings" panel,
        // but we don't echo them inline — the strikethrough text clutters every cell the user has
        // already acknowledged (especially after Clear all, where every empty required cell has one).
        if (dismissals[c.key]) return null;
        return (
          <span
            key={c.key}
            className={`conflict ${c.severity}`}
            title={c.rule}
            onClick={(e) => {
              // In placement mode, let the click bubble to the cell so the sister gets assigned.
              if (selectedSisterId) return;
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

import { useState } from 'react';
import {
  HONEY_JOBS,
  slotLabelForDay,
  type Conflict,
  type DayOfWeek,
  type HoneyJob,
  type Sister,
  type Slot,
} from '../types';
import { SisterChip } from './SisterChip';

type Props = {
  day: DayOfWeek;
  slot: Slot;
  sisterIds: string[];
  note?: string;
  honeyJobs?: Record<string, HoneyJob>;
  conflicts: Conflict[];
  dismissals: Record<string, string>;
  rosterById: Record<string, Sister>;
  selectedSisterId: string | null;
  isSundayDivider?: boolean;
  isLastColumn?: boolean;
  dimmed?: boolean;
  onAssign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onReplace: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onUnassign: (day: DayOfWeek, slot: Slot, sisterId: string) => void;
  onDismissConflict: (key: string) => void;
  onCellNotePrompt: (day: DayOfWeek, slot: Slot) => void;
  onClearCellNote?: (day: DayOfWeek, slot: Slot) => void;
  onSetHoneyJobForSister?: (day: DayOfWeek, sisterId: string, job: HoneyJob | null) => void;
  onEmptyCellClick?: () => void;
};

export function Cell({
  day,
  slot,
  sisterIds,
  note,
  honeyJobs,
  conflicts,
  dismissals,
  rosterById,
  selectedSisterId,
  isSundayDivider,
  isLastColumn,
  dimmed,
  onAssign,
  onReplace,
  onUnassign,
  onDismissConflict,
  onCellNotePrompt,
  onClearCellNote,
  onSetHoneyJobForSister,
  onEmptyCellClick,
}: Props) {
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
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
    if (target.closest('.honey-job')) return;
    if (target.closest('.add-another')) return;
    // When no sister is being placed, the conflict span owns its own click (toggle dismissal).
    // When a sister IS selected, conflict text must not block placement — let it through.
    if (!selectedSisterId) {
      if (target.closest('.conflict')) return;
      onEmptyCellClick?.();
      return;
    }
    if (sisterIds.includes(selectedSisterId)) {
      onUnassign(day, slot, selectedSisterId);
      return;
    }
    // Default: replace any existing sister(s). Shift-click adds (for multi-person cells).
    if (e.shiftKey) {
      onAssign(day, slot, selectedSisterId);
    } else {
      onReplace(day, slot, selectedSisterId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onCellNotePrompt(day, slot);
  };

  // Sunday Lunch / Main Meal label inside the cell (data slot remains dinner/supper).
  const sundayMealCaption =
    day === 'sun' && (slot === 'dinner' || slot === 'supper')
      ? slotLabelForDay(slot, day)
      : null;

  return (
    <div
      className={cls}
      data-day={day}
      data-slot={slot}
      onClick={handleCellClick}
      onContextMenu={handleContextMenu}
      title={selectedSisterId ? 'Click to assign here' : 'Right-click to add a note'}
    >
      {sundayMealCaption && <span className="sunday-meal-caption">{sundayMealCaption}</span>}
      <div className="chips">
        {sisterIds.map((id) => {
          const s = rosterById[id];
          if (!s) return null;
          const job = slot === 'honey' ? honeyJobs?.[id] : undefined;
          return (
            <span key={id} className="chip-with-job">
              <SisterChip
                sister={s}
                assignedHere
                tip="Click to remove"
                onClick={() => onUnassign(day, slot, id)}
              />
              {slot === 'honey' && onSetHoneyJobForSister && (
                <span className="honey-job" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`honey-job-trigger ${job ? 'set' : 'unset'}`}
                    onClick={() =>
                      setPickerOpenFor((cur) => (cur === id ? null : id))
                    }
                    title="Pick this sister's honey job"
                  >
                    {job ?? 'pick job'}
                  </button>
                  {pickerOpenFor === id && (
                    <div className="honey-job-picker">
                      {HONEY_JOBS.map((j) => (
                        <button
                          key={j}
                          type="button"
                          className={job === j ? 'selected' : ''}
                          onClick={() => {
                            onSetHoneyJobForSister(day, id, j);
                            setPickerOpenFor(null);
                          }}
                        >
                          {j}
                        </button>
                      ))}
                      {job && (
                        <button
                          type="button"
                          className="clear"
                          onClick={() => {
                            onSetHoneyJobForSister(day, id, null);
                            setPickerOpenFor(null);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </span>
              )}
            </span>
          );
        })}
        {/* Visible "add another" affordance — shown when a sister is selected and the
            cell already has someone. Discoverable replacement for shift-click. */}
        {selectedSisterId &&
          sisterIds.length > 0 &&
          !sisterIds.includes(selectedSisterId) && (
            <button
              type="button"
              className="add-another no-print"
              title="Add this sister alongside the others"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(day, slot, selectedSisterId);
              }}
            >
              + add {rosterById[selectedSisterId]?.name ?? ''}
            </button>
          )}
      </div>
      {note && (
        <span className="cell-note">
          — {note}
          {onClearCellNote && (
            <button
              type="button"
              className="cell-note-clear no-print"
              title="Clear this note"
              onClick={(e) => {
                e.stopPropagation();
                onClearCellNote(day, slot);
              }}
              aria-label="Clear note"
            >
              ×
            </button>
          )}
        </span>
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

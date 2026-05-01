import { useEffect, useMemo, useState, useCallback } from 'react';
import type { DayOfWeek, Slot, Week } from './types';
import { ROSTER, SISTER_BY_ID } from './data/roster';
import { freshWeek, mondayOf, defaultAssignments } from './data/defaults';
import { validateWeek } from './rules';
import { useUndoable } from './hooks/useUndoable';
import { WeekHeader } from './components/WeekHeader';
import { ContextStrip } from './components/ContextStrip';
import { Grid } from './components/Grid';
import { SisterPalette } from './components/SisterPalette';
import { PrintFrame } from './components/PrintFrame';
import { Tour } from './components/Tour';

const STORAGE_PREFIX = 'monastery-schedule:week:';
const TOUR_KEY = 'monastery-schedule:tour-seen';

function readWeek(weekOf: string): Week {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + weekOf);
    if (raw) return JSON.parse(raw) as Week;
  } catch {
    // ignore
  }
  return freshWeek(weekOf);
}

function writeWeek(week: Week) {
  try {
    localStorage.setItem(STORAGE_PREFIX + week.weekOf, JSON.stringify(week));
  } catch {
    // ignore
  }
}

export function App() {
  const initialWeekOf = mondayOf(new Date());
  const { value: week, set: setWeek, replace: replaceWeek } = useUndoable<Week>(
    readWeek(initialWeekOf),
  );
  const [selectedSisterId, setSelectedSisterId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState<boolean>(() => {
    try { return !localStorage.getItem(TOUR_KEY); } catch { return true; }
  });
  const closeTour = useCallback(() => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
    setShowTour(false);
  }, []);
  const openTour = useCallback(() => setShowTour(true), []);
  const [notePrompt, setNotePrompt] = useState<
    | { kind: 'cell'; day: DayOfWeek; slot: Slot; current: string }
    | { kind: 'dismissal'; conflictKey: string; current: string }
    | null
  >(null);

  // Load when weekOf changes
  const switchToWeek = useCallback(
    (iso: string) => {
      replaceWeek(readWeek(iso));
    },
    [replaceWeek],
  );

  // Auto-save on every state change
  useEffect(() => {
    writeWeek(week);
  }, [week]);

  const conflicts = useMemo(() => validateWeek(week, ROSTER).conflicts, [week]);

  const onAssign = (day: DayOfWeek, slot: Slot, sisterId: string) => {
    setWeek((w) => {
      const existing = w.assignments.find((a) => a.day === day && a.slot === slot);
      if (existing && existing.sisterIds.includes(sisterId)) return w;
      const next = existing
        ? w.assignments.map((a) =>
            a === existing ? { ...a, sisterIds: [...a.sisterIds, sisterId] } : a,
          )
        : [...w.assignments, { day, slot, sisterIds: [sisterId] }];
      return { ...w, assignments: next };
    });
  };

  const onUnassign = (day: DayOfWeek, slot: Slot, sisterId: string) => {
    setWeek((w) => {
      const next = w.assignments
        .map((a) =>
          a.day === day && a.slot === slot
            ? { ...a, sisterIds: a.sisterIds.filter((id) => id !== sisterId) }
            : a,
        )
        .filter((a) => a.sisterIds.length > 0 || a.note);
      return { ...w, assignments: next };
    });
  };

  const onDismissConflict = (key: string) => {
    if (week.dismissals[key]) {
      // toggle off
      setWeek((w) => {
        const { [key]: _, ...rest } = w.dismissals;
        return { ...w, dismissals: rest };
      });
      return;
    }
    setNotePrompt({ kind: 'dismissal', conflictKey: key, current: '' });
  };

  const onCellNotePrompt = (day: DayOfWeek, slot: Slot) => {
    const a = week.assignments.find((x) => x.day === day && x.slot === slot);
    setNotePrompt({ kind: 'cell', day, slot, current: a?.note ?? '' });
  };

  const submitNote = (text: string) => {
    if (!notePrompt) return;
    if (notePrompt.kind === 'cell') {
      const { day, slot } = notePrompt;
      setWeek((w) => {
        const existing = w.assignments.find((a) => a.day === day && a.slot === slot);
        const trimmed = text.trim();
        if (existing) {
          if (!trimmed && existing.sisterIds.length === 0) {
            return { ...w, assignments: w.assignments.filter((a) => a !== existing) };
          }
          return {
            ...w,
            assignments: w.assignments.map((a) =>
              a === existing ? { ...a, note: trimmed || undefined } : a,
            ),
          };
        }
        if (!trimmed) return w;
        return {
          ...w,
          assignments: [...w.assignments, { day, slot, sisterIds: [], note: trimmed }],
        };
      });
    } else {
      const { conflictKey } = notePrompt;
      setWeek((w) => ({
        ...w,
        dismissals: { ...w.dismissals, [conflictKey]: text.trim() || 'Approved' },
      }));
    }
    setNotePrompt(null);
  };

  const onPrint = () => {
    window.print();
  };

  const onResetWeek = () => {
    if (!confirm('Reset this week to the standing pattern? Your dismissed conflicts and notes will be cleared.')) return;
    setWeek({
      ...week,
      assignments: defaultAssignments(),
      dismissals: {},
    });
  };

  return (
    <div className="app">
      <WeekHeader week={week} conflicts={conflicts} onWeekOfChange={switchToWeek} />
      <ContextStrip week={week} roster={ROSTER} onUpdateWeek={(w) => setWeek(w)} />
      <div className="layout no-print">
        <Grid
          week={week}
          conflicts={conflicts}
          rosterById={SISTER_BY_ID}
          selectedSisterId={selectedSisterId}
          onAssign={(day, slot, id) => {
            onAssign(day, slot, id);
            // keep selection: she may want to assign the same sister elsewhere; tap chip again to clear
          }}
          onUnassign={onUnassign}
          onDismissConflict={onDismissConflict}
          onCellNotePrompt={onCellNotePrompt}
        />
        <SisterPalette
          roster={ROSTER}
          week={week}
          selectedSisterId={selectedSisterId}
          onSelectSister={setSelectedSisterId}
          onPrint={onPrint}
          onResetWeek={onResetWeek}
          onShowTour={openTour}
        />
      </div>

      {selectedSisterId && (
        <div className="selection-toast no-print">
          Placing <em>{SISTER_BY_ID[selectedSisterId]?.name}</em> — click a cell.
          <button onClick={() => setSelectedSisterId(null)}>Cancel</button>
        </div>
      )}

      {notePrompt && (
        <NotePrompt
          title={notePrompt.kind === 'cell' ? 'Add a note to this cell' : 'Dismiss this conflict'}
          subtitle={
            notePrompt.kind === 'cell'
              ? 'A short reminder that prints with the schedule.'
              : 'A short reason — e.g., "Approved, sister traveling."'
          }
          initial={notePrompt.current}
          onSubmit={submitNote}
          onCancel={() => setNotePrompt(null)}
        />
      )}

      <PrintFrame week={week} rosterById={SISTER_BY_ID} />

      {showTour && <Tour onClose={closeTour} />}
    </div>
  );
}

function NotePrompt({
  title,
  subtitle,
  initial,
  onSubmit,
  onCancel,
}: {
  title: string;
  subtitle: string;
  initial: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="note-prompt" onClick={onCancel}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit(text);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSubmit(text)}>Save</button>
        </div>
      </div>
    </div>
  );
}

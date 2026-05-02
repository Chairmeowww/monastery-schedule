import { useEffect, useMemo, useState, useCallback } from 'react';
import type { DayOfWeek, HoneyJob, Slot, Week } from './types';
import { ROSTER, SISTER_BY_ID } from './data/roster';
import {
  freshWeek,
  mondayOf,
  defaultAssignments,
  defaultSoupDays,
  emptyWeek,
  saveStandingPattern,
  loadStandingPattern,
} from './data/defaults';
import { validateWeek } from './rules';
import { useUndoable } from './hooks/useUndoable';
import { WeekHeader } from './components/WeekHeader';
import { ContextStrip } from './components/ContextStrip';
import { Grid } from './components/Grid';
import { SisterPalette } from './components/SisterPalette';
import { PrintFrame } from './components/PrintFrame';
import { Tour } from './components/Tour';
import { ConflictList } from './components/ConflictList';

const STORAGE_PREFIX = 'monastery-schedule:week:';
const TOUR_KEY = 'monastery-schedule:tour-seen';

const CLEAR_ALL_NOTE = 'Cleared by user';

/**
 * When the user touches a cell after Clear all, wake up dismissed warnings for the
 * SLOT she touched (across all days). E.g. touching Mon shipping wakes Tue/Wed/Thu
 * shipping warnings too — but touching Eucharist doesn't disturb shipping/laundry.
 * Manual dismissals (custom notes) are preserved.
 */
function dropClearAllDismissals(
  dismissals: Record<string, string>,
  _day: string,
  slot: string,
): Record<string, string> {
  const slotMarker = `::${slot}`;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dismissals)) {
    if (v !== CLEAR_ALL_NOTE) {
      out[k] = v;
      continue;
    }
    const matchesSlot = k.includes(`${slotMarker}::`) || k.endsWith(slotMarker);
    if (matchesSlot) continue;
    out[k] = v;
  }
  return out;
}

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
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const flashHint = useCallback((msg: string) => {
    setHintMessage(msg);
    window.setTimeout(() => setHintMessage(null), 2800);
  }, []);
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
      return { ...w, assignments: next, dismissals: dropClearAllDismissals(w.dismissals, day, slot) };
    });
  };

  /** Default click — replace whatever is in the cell with this single sister. */
  const onReplace = (day: DayOfWeek, slot: Slot, sisterId: string) => {
    setWeek((w) => {
      const existing = w.assignments.find((a) => a.day === day && a.slot === slot);
      const replaced = existing
        ? w.assignments.map((a) =>
            a === existing ? { ...a, sisterIds: [sisterId] } : a,
          )
        : [...w.assignments, { day, slot, sisterIds: [sisterId] }];
      return { ...w, assignments: replaced, dismissals: dropClearAllDismissals(w.dismissals, day, slot) };
    });
  };

  const onSetHoneyJob = (day: DayOfWeek, job: HoneyJob | null) => {
    setWeek((w) => {
      const existing = w.assignments.find((a) => a.day === day && a.slot === 'honey');
      if (!existing) return w;
      const updated = { ...existing, honeyJob: job ?? undefined };
      return {
        ...w,
        assignments: w.assignments.map((a) => (a === existing ? updated : a)),
        dismissals: dropClearAllDismissals(w.dismissals, day, 'honey'),
      };
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
      return { ...w, assignments: next, dismissals: dropClearAllDismissals(w.dismissals, day, slot) };
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

  const onClearCellNote = (day: DayOfWeek, slot: Slot) => {
    setWeek((w) => {
      const existing = w.assignments.find((a) => a.day === day && a.slot === slot);
      if (!existing) return w;
      // If only the note made the assignment exist (no sisters), remove the assignment entirely.
      if (existing.sisterIds.length === 0) {
        return { ...w, assignments: w.assignments.filter((a) => a !== existing) };
      }
      return {
        ...w,
        assignments: w.assignments.map((a) =>
          a === existing ? { ...a, note: undefined } : a,
        ),
      };
    });
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

  const [standingSavedAt, setStandingSavedAt] = useState<string | null>(
    () => loadStandingPattern()?.savedAt ?? null,
  );

  const onResetWeek = () => {
    if (!confirm('Reset this week to the standing pattern? Your dismissed conflicts and notes will be cleared.')) return;
    setWeek({
      ...week,
      assignments: defaultAssignments(),
      soupDays: defaultSoupDays(),
      dismissals: {},
    });
  };

  const onSetAsDefault = () => {
    if (
      !confirm(
        "Save this week's pattern as the new standing pattern? It will be used to pre-fill every new week from now on. A backup file will also download to your computer.",
      )
    ) {
      return;
    }
    saveStandingPattern(week.assignments, week.soupDays);
    setStandingSavedAt(loadStandingPattern()?.savedAt ?? null);
    // Auto-export a backup file: localStorage alone isn't durable (browser wipes,
    // device swaps, etc). The download lands in her Downloads folder where most
    // cloud sync services (iCloud Drive, OneDrive, Dropbox) replicate it offsite.
    onExportStandingPattern();
  };

  const onExportStandingPattern = () => {
    const pattern = loadStandingPattern() ?? {
      assignments: defaultAssignments(),
      soupDays: defaultSoupDays(),
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monastery-standing-pattern-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onImportStandingPattern = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.assignments) || !Array.isArray(parsed.soupDays)) {
          alert('That file does not look like a standing pattern (missing assignments or soupDays).');
          return;
        }
        if (!confirm('Replace your current standing pattern with the contents of this file? This cannot be undone except by re-importing the previous file.')) {
          return;
        }
        saveStandingPattern(parsed.assignments, parsed.soupDays);
        setStandingSavedAt(loadStandingPattern()?.savedAt ?? null);
        alert('Standing pattern imported. New weeks will start from this pattern.');
      } catch (e) {
        alert(`Could not read that file: ${e instanceof Error ? e.message : 'invalid JSON'}.`);
      }
    };
    reader.readAsText(file);
  };

  const onClearWeek = () => {
    if (
      !confirm(
        'Clear every assignment in this week? This cannot be undone except by Reset to default. Appointments and solitude entries will also be removed.',
      )
    ) {
      return;
    }
    const blank = emptyWeek(week.weekOf);
    // Suppress every "missing assignment" warning that the cleared state would surface —
    // she just told us she wants a blank canvas. As she fills cells, these dismissals
    // either become irrelevant (the conflict goes away) or stay quietly suppressed.
    const presetDismissals: Record<string, string> = {};
    for (const c of validateWeek(blank, ROSTER).conflicts) {
      presetDismissals[c.key] = CLEAR_ALL_NOTE;
    }
    setWeek({ ...blank, dismissals: presetDismissals });
  };

  const dismissByKey = (key: string, note: string) => {
    setWeek((w) => ({ ...w, dismissals: { ...w.dismissals, [key]: note } }));
  };
  const undismissByKey = (key: string) => {
    setWeek((w) => {
      const { [key]: _, ...rest } = w.dismissals;
      return { ...w, dismissals: rest };
    });
  };

  return (
    <div className="app">
      <WeekHeader week={week} conflicts={conflicts} onWeekOfChange={switchToWeek} />
      <ContextStrip week={week} roster={ROSTER} onUpdateWeek={(w) => setWeek(w)} />
      <ConflictList
        conflicts={conflicts}
        week={week}
        onDismiss={dismissByKey}
        onUndismiss={undismissByKey}
      />
      {week.assignments.length === 0 && !standingSavedAt && (
        <div className="empty-week-hint no-print">
          <strong>Empty week.</strong>
          <span>
            Click a sister on the right, then click a cell to assign her. Once your typical
            week is filled in, click <em>Set as default</em> to save it as your standing pattern —
            every new week will start from there.
          </span>
        </div>
      )}
      {week.assignments.length === 0 && standingSavedAt && (
        <div className="empty-week-hint no-print">
          <strong>This week is empty.</strong>
          <span>
            Click <em>Reset to default</em> on the right to bring back your saved standing pattern,
            or start filling in cells to build this week from scratch.
          </span>
        </div>
      )}
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
          onReplace={onReplace}
          onUnassign={onUnassign}
          onDismissConflict={onDismissConflict}
          onCellNotePrompt={onCellNotePrompt}
          onClearCellNote={onClearCellNote}
          onSetHoneyJob={onSetHoneyJob}
          onEmptyCellClick={() => flashHint('Pick a sister on the right, then click a cell.')}
        />
        <SisterPalette
          roster={ROSTER}
          week={week}
          selectedSisterId={selectedSisterId}
          onSelectSister={setSelectedSisterId}
          onPrint={onPrint}
          onResetWeek={onResetWeek}
          onSetAsDefault={onSetAsDefault}
          onClearWeek={onClearWeek}
          onExportStandingPattern={onExportStandingPattern}
          onImportStandingPattern={onImportStandingPattern}
          onShowTour={openTour}
          standingSavedAt={standingSavedAt}
        />
      </div>

      {selectedSisterId && (
        <div className="selection-toast no-print">
          Placing <em>{SISTER_BY_ID[selectedSisterId]?.name}</em> — click a cell.
          <button onClick={() => setSelectedSisterId(null)}>Cancel</button>
        </div>
      )}

      {!selectedSisterId && hintMessage && (
        <div className="selection-toast no-print">{hintMessage}</div>
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
            // Slack/iMessage-style: Enter saves, Shift+Enter inserts a newline.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(text);
            }
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

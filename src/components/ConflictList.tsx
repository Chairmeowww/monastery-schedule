import { useState } from 'react';
import type { Conflict, Week } from '../types';

type Props = {
  conflicts: Conflict[];
  week: Week;
  onDismiss: (key: string, note: string) => void;
  onUndismiss: (key: string) => void;
};

export function ConflictList({ conflicts, week, onDismiss, onUndismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  const active = conflicts.filter((c) => !week.dismissals[c.key]);
  const dismissed = conflicts.filter((c) => week.dismissals[c.key]);
  // Cells still surface every per-cell instance of a conflict, but the panel collapses
  // duplicates by (rule, message) so the same warning isn't listed twice.
  const dedup = (items: Conflict[]) => {
    const seen = new Set<string>();
    return items.filter((c) => {
      const k = `${c.rule}::${c.message}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const hard = dedup(active.filter((c) => c.severity === 'hard'));
  const soft = dedup(active.filter((c) => c.severity === 'soft'));
  const dismissedDeduped = dedup(dismissed);

  if (active.length === 0 && dismissed.length === 0) return null;

  return (
    <section className="conflict-list no-print" aria-label="Conflicts and warnings">
      <button className="conflict-list-toggle" onClick={() => setExpanded((e) => !e)}>
        {expanded ? '▾ Hide details' : '▸ Show all conflicts and warnings'}
      </button>
      {expanded && (
        <div className="conflict-list-items">
          {hard.length > 0 && (
            <div className="conflict-group">
              <h4>Conflicts</h4>
              <ul>
                {hard.map((c) => (
                  <ConflictRow key={c.key} c={c} onAction={() => promptDismiss(c, onDismiss)} />
                ))}
              </ul>
            </div>
          )}
          {soft.length > 0 && (
            <div className="conflict-group">
              <h4>Soft warnings</h4>
              <ul>
                {soft.map((c) => (
                  <ConflictRow key={c.key} c={c} onAction={() => promptDismiss(c, onDismiss)} />
                ))}
              </ul>
            </div>
          )}
          {dismissedDeduped.length > 0 && (
            <div className="conflict-group">
              <h4>Dismissed this week</h4>
              <ul>
                {dismissedDeduped.map((c) => (
                  <li key={c.key} className="conflict-row dismissed">
                    <span className="row-rule">{c.rule}</span>
                    <span className="row-message">{c.message}</span>
                    <span className="row-note">— {week.dismissals[c.key]}</span>
                    <button className="row-action" onClick={() => onUndismiss(c.key)}>
                      Undo dismiss
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ConflictRow({ c, onAction }: { c: Conflict; onAction: () => void }) {
  return (
    <li className={`conflict-row ${c.severity}`}>
      <span className="row-rule">{c.rule}</span>
      <span className="row-message">{c.message}</span>
      <button className="row-action" onClick={onAction}>
        Dismiss with note
      </button>
    </li>
  );
}

function promptDismiss(c: Conflict, onDismiss: (key: string, note: string) => void) {
  const note = window.prompt(`Dismiss "${c.message}" — give a reason:`, 'Approved');
  if (note != null) onDismiss(c.key, note.trim() || 'Approved');
}

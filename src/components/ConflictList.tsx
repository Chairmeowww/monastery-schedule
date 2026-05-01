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
  const hard = active.filter((c) => c.severity === 'hard');
  const soft = active.filter((c) => c.severity === 'soft');

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
          {dismissed.length > 0 && (
            <div className="conflict-group">
              <h4>Dismissed this week</h4>
              <ul>
                {dismissed.map((c) => (
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

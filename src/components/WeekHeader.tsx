import type { Conflict, Week } from '../types';
import { fromISODate } from '../data/defaults';

type Props = {
  week: Week;
  conflicts: Conflict[];
  onWeekOfChange: (iso: string) => void;
};

function formatWeekOf(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function WeekHeader({ week, conflicts, onWeekOfChange }: Props) {
  const visible = conflicts.filter((c) => !week.dismissals[c.key]);
  const hard = visible.filter((c) => c.severity === 'hard').length;
  const soft = visible.filter((c) => c.severity === 'soft').length;

  let summaryText = 'Schedule is clear.';
  let summaryClass = 'clear';
  if (hard > 0) {
    summaryText = `${hard} conflict${hard === 1 ? '' : 's'}`;
    if (soft > 0) summaryText += ` · ${soft} soft warning${soft === 1 ? '' : 's'}`;
    summaryClass = 'has-issues';
  } else if (soft > 0) {
    summaryText = `${soft} soft warning${soft === 1 ? '' : 's'}`;
    summaryClass = '';
  }

  return (
    <header className="week-header no-print">
      <div className="week-title">
        <span className="label">The week of</span>
        <h1>{formatWeekOf(week.weekOf)}</h1>
      </div>
      <div className="week-controls">
        <input
          type="date"
          value={week.weekOf}
          onChange={(e) => onWeekOfChange(e.target.value)}
        />
        <span className={`conflict-summary ${summaryClass}`}>{summaryText}</span>
      </div>
    </header>
  );
}

import type { Sister, Week } from '../types';
import { SisterChip } from './SisterChip';

type Props = {
  roster: Sister[];
  week: Week;
  selectedSisterId: string | null;
  onSelectSister: (id: string | null) => void;
  onPrint: () => void;
  onResetWeek: () => void;
  onSetAsDefault: () => void;
  onClearWeek: () => void;
  onShowTour: () => void;
  /** ISO timestamp of the most recent "Set as default", or null if never customized. */
  standingSavedAt: string | null;
};

export function SisterPalette({
  roster,
  week,
  selectedSisterId,
  onSelectSister,
  onPrint,
  onResetWeek,
  onSetAsDefault,
  onClearWeek,
  onShowTour,
  standingSavedAt,
}: Props) {
  // Build per-sister stats
  const stats = roster.map((s) => {
    const count = week.assignments
      .filter((a) => a.sisterIds.includes(s.id))
      .length;
    const appt = week.appointments.find((a) => a.sisterId === s.id);
    return { sister: s, count, hasAppointment: !!appt };
  });

  return (
    <aside className="palette no-print" aria-label="Sister palette">
      <h2>Sisters</h2>
      <div className="chips">
        {stats.map(({ sister, count, hasAppointment }) => (
          <span key={sister.id} data-sister-id={sister.id}>
            <SisterChip
              sister={sister}
              count={count}
              showCount
              hasAppointment={hasAppointment}
              selected={selectedSisterId === sister.id}
              tip={
                sister.restrictions.length
                  ? sister.restrictions.join(' · ')
                  : 'Click, then click a cell to assign'
              }
              onClick={() => onSelectSister(selectedSisterId === sister.id ? null : sister.id)}
            />
          </span>
        ))}
      </div>
      <p className="help">
        Click a sister, then click a cell to assign her. Click an assigned chip in a cell to remove
        her.
      </p>
      <div className="palette-actions">
        <button onClick={onPrint}>Print schedule</button>
        <button onClick={onShowTour}>Show tour</button>
        <button onClick={onResetWeek} title="Restore the saved standing pattern for this week">
          Reset to default
        </button>
        <button
          onClick={onSetAsDefault}
          title="Save this week's pattern as the standing pattern for all new weeks"
        >
          Set as default
        </button>
        <button onClick={onClearWeek} title="Empty every cell in this week">
          Clear all
        </button>
        {standingSavedAt && (
          <p className="standing-meta">Standing pattern saved {formatSavedAt(standingSavedAt)}</p>
        )}
      </div>
    </aside>
  );
}

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

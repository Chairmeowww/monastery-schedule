import {
  DAYS,
  DAY_SHORT,
  SLOTS,
  SLOT_LABEL,
  type Sister,
  type Week,
} from '../types';
import { fromISODate } from '../data/defaults';

type Props = {
  week: Week;
  rosterById: Record<string, Sister>;
};

export function PrintFrame({ week, rosterById }: Props) {
  const date = fromISODate(week.weekOf);
  return (
    <div className="print-frame">
      <h1>
        Schedule for the week of{' '}
        {date.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h1>
      <div className="grid">
        <div className="head" />
        {DAYS.map((d) => (
          <div key={d} className={`head ${d === 'sun' ? 'sunday-divider' : ''}`}>
            {DAY_SHORT[d]}
            {week.daySolitude === d ? ' ·' : ''}
          </div>
        ))}
        {SLOTS.map((slot) => (
          <PrintRow key={slot} slot={slot} week={week} rosterById={rosterById} />
        ))}
      </div>
      <footer>
        {week.daySolitude
          ? `Day of solitude: ${week.daySolitude.toUpperCase()}`
          : ''}
        {week.appointments.length > 0 && (
          <span>
            {' '}
            · Appointments:{' '}
            {week.appointments
              .map((a) => `${rosterById[a.sisterId]?.name ?? a.sisterId} (${a.day})`)
              .join(', ')}
          </span>
        )}
      </footer>
    </div>
  );
}

function PrintRow({
  slot,
  week,
  rosterById,
}: {
  slot: Week['assignments'][number]['slot'];
  week: Week;
  rosterById: Record<string, Sister>;
}) {
  return (
    <>
      <div className="row-label">{SLOT_LABEL[slot]}</div>
      {DAYS.map((day) => {
        const a = week.assignments.find((x) => x.day === day && x.slot === slot);
        const ids = a?.sisterIds ?? [];
        return (
          <div
            key={day}
            className={`cell ${day === 'sun' ? 'sunday-divider' : ''} ${day === 'sun' ? 'last' : ''}`}
          >
            {ids.length === 0 ? (
              <span style={{ color: 'var(--hair)' }}>·</span>
            ) : (
              <span style={{ fontStyle: 'italic' }}>
                {ids.map((id) => rosterById[id]?.name ?? id).join(' · ')}
              </span>
            )}
            {a?.honeyJob && (
              <span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>
                {a.honeyJob}
              </span>
            )}
            {a?.note && (
              <span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>
                {a.note}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

import { DAYS, DAY_LABEL, type DayOfWeek, type Sister, type Week } from '../types';

type Props = {
  week: Week;
  roster: Sister[];
  onUpdateWeek: (next: Week) => void;
};

export function ContextStrip({ week, roster, onUpdateWeek }: Props) {
  const setSolitude = (d: DayOfWeek | '') => {
    onUpdateWeek({ ...week, daySolitude: d || undefined });
  };

  const setSoupDays = (vals: DayOfWeek[]) => {
    onUpdateWeek({ ...week, soupDays: vals });
  };

  const addAppointment = () => {
    onUpdateWeek({
      ...week,
      appointments: [
        ...week.appointments,
        { sisterId: roster[0].id, day: 'mon', type: 'Doctor' },
      ],
    });
  };

  const removeAppointment = (idx: number) => {
    onUpdateWeek({
      ...week,
      appointments: week.appointments.filter((_, i) => i !== idx),
    });
  };

  const updateAppointment = (idx: number, patch: Partial<Week['appointments'][number]>) => {
    onUpdateWeek({
      ...week,
      appointments: week.appointments.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    });
  };

  return (
    <div className="context-strip no-print">
      <div className="field">
        <span className="label">Day of solitude</span>
        <select
          value={week.daySolitude ?? ''}
          onChange={(e) => setSolitude(e.target.value as DayOfWeek | '')}
        >
          <option value="">— none —</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {DAY_LABEL[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="label">Soup days</span>
        <SoupDayPicker days={week.soupDays} onChange={setSoupDays} />
      </div>

      <div className="field">
        <span className="label">Appointments</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {week.appointments.map((appt, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                background: 'var(--ground)',
                border: '1px solid var(--hair-light)',
                borderRadius: '999px',
                fontSize: 'var(--fs-xs)',
              }}
            >
              <select
                value={appt.sisterId}
                onChange={(e) => updateAppointment(i, { sisterId: e.target.value })}
                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 'var(--fs-xs)' }}
              >
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={appt.day}
                onChange={(e) => updateAppointment(i, { day: e.target.value as DayOfWeek })}
                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 'var(--fs-xs)' }}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABEL[d]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeAppointment(i)}
                aria-label="Remove appointment"
                style={{ padding: '0 6px', fontSize: 'var(--fs-xs)', border: 'none' }}
              >
                ×
              </button>
            </span>
          ))}
          <button onClick={addAppointment} style={{ fontSize: 'var(--fs-xs)' }}>
            + add
          </button>
        </div>
      </div>
    </div>
  );
}

function SoupDayPicker({ days, onChange }: { days: DayOfWeek[]; onChange: (d: DayOfWeek[]) => void }) {
  const toggle = (d: DayOfWeek) => {
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  };
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {DAYS.map((d) => {
        const on = days.includes(d);
        return (
          <button
            key={d}
            onClick={() => toggle(d)}
            style={{
              padding: '2px 8px',
              fontSize: 'var(--fs-xs)',
              fontStyle: 'italic',
              borderColor: on ? 'var(--accent)' : 'var(--hair-light)',
              background: on ? 'var(--soft-gold-bg)' : 'transparent',
              color: on ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            {DAY_LABEL[d].slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

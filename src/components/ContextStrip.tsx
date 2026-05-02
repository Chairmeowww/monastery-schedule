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

  const addAppointmentForDay = (day: DayOfWeek) => {
    onUpdateWeek({
      ...week,
      appointments: [
        ...week.appointments,
        { sisterId: roster[0].id, day, type: 'Doctor' },
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
        <span className="hint">the quiet day this week</span>
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
        <span className="hint">days soup is served at supper</span>
        <SoupDayPicker days={week.soupDays} onChange={setSoupDays} />
      </div>

      <div className="field appointments-field">
        <span className="label">Appointments</span>
        <span className="hint">doctor visits — clears that day’s duties</span>
        <div className="appointments-row">
          {DAYS.map((day) => {
            const idx = week.appointments.findIndex((a) => a.day === day);
            const appt = idx >= 0 ? week.appointments[idx] : null;
            return (
              <div key={day} className={`appt-cell ${appt ? 'has-appt' : 'empty'}`}>
                <span className="appt-day">{DAY_LABEL[day].slice(0, 3)}</span>
                {appt ? (
                  <div className="appt-content">
                    <select
                      value={appt.sisterId}
                      onChange={(e) => updateAppointment(idx, { sisterId: e.target.value })}
                      className="appt-sister"
                    >
                      {roster.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={appt.type}
                      onChange={(e) => updateAppointment(idx, { type: e.target.value })}
                      className="appt-type"
                      placeholder="type"
                    />
                    <button
                      onClick={() => removeAppointment(idx)}
                      aria-label="Remove appointment"
                      className="appt-remove"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    className="appt-add"
                    onClick={() => addAppointmentForDay(day)}
                    title={`Add appointment for ${DAY_LABEL[day]}`}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
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

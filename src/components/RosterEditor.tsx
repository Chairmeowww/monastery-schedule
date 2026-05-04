import { useState } from 'react';
import type { Ability, Sister } from '../types';
import { ALL_ABILITIES, makeNewSister } from '../data/rosterStore';

type Props = {
  initial: Sister[];
  onSave: (next: Sister[]) => void;
  onCancel: () => void;
};

const ABILITY_LABEL: Record<Ability, string> = {
  dinner_cook: 'Dinner cook',
  supper_cook: 'Supper cook',
  table_server: 'Table server',
  eucharist_setup: 'Eucharist setup',
  shipping: 'Shipping',
  soup_maker: 'Soup maker',
  honey_mix: 'Honey · mix',
  honey_fill: 'Honey · fill',
  honey_labels: 'Honey · labels',
  honey_lids: 'Honey · lids',
  garden: 'Garden',
  laundry: 'Laundry',
  ironing: 'Ironing',
  cleaning: 'Cleaning',
  driver: 'Driver',
};

export function RosterEditor({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Sister[]>(() =>
    initial.map((s) => ({
      ...s,
      abilities: [...s.abilities],
      restrictions: [...s.restrictions],
    })),
  );

  const update = (id: string, patch: Partial<Sister>) => {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const toggleAbility = (id: string, ability: Ability) => {
    setDraft((d) =>
      d.map((s) =>
        s.id === id
          ? {
              ...s,
              abilities: s.abilities.includes(ability)
                ? s.abilities.filter((a) => a !== ability)
                : [...s.abilities, ability],
            }
          : s,
      ),
    );
  };

  const remove = (id: string) => {
    if (!confirm('Remove this sister from the roster? Any existing assignments will keep her name but you won’t be able to assign her to new cells.')) return;
    setDraft((d) => d.filter((s) => s.id !== id));
  };

  const addNew = () => {
    const name = prompt('New sister’s name?');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (draft.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A sister with that name already exists.');
      return;
    }
    const fresh = makeNewSister(trimmed);
    // Avoid id collision with existing roster entries
    if (draft.some((s) => s.id === fresh.id)) {
      fresh.id = `${fresh.id}_${Date.now()}`;
    }
    setDraft((d) => [...d, fresh]);
  };

  const save = () => {
    // Light sanity: drop sisters with empty names.
    const clean = draft
      .map((s) => ({ ...s, name: s.name.trim() }))
      .filter((s) => s.name.length > 0);
    onSave(clean);
  };

  return (
    <div className="note-prompt" onClick={onCancel}>
      <div
        className="panel roster-editor"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Manage sisters"
      >
        <h3>Sisters</h3>
        <p>
          Add a new sister, rename someone, or update what jobs each sister does. Changes save when you click <em>Save</em>.
        </p>
        <div className="roster-rows">
          {draft.map((s) => (
            <div key={s.id} className="roster-row">
              <div className="roster-row-head">
                <input
                  className="roster-name"
                  value={s.name}
                  onChange={(e) => update(s.id, { name: e.target.value })}
                  placeholder="Name"
                  aria-label={`${s.name} name`}
                />
                <button
                  type="button"
                  className="roster-remove link-btn"
                  onClick={() => remove(s.id)}
                  title="Remove this sister"
                >
                  remove
                </button>
              </div>
              <div className="roster-abilities">
                {ALL_ABILITIES.map((ab) => (
                  <label key={ab} className="ability-toggle">
                    <input
                      type="checkbox"
                      checked={s.abilities.includes(ab)}
                      onChange={() => toggleAbility(s.id, ab)}
                    />
                    <span>{ABILITY_LABEL[ab]}</span>
                  </label>
                ))}
              </div>
              <div className="roster-restrictions">
                <span className="hint">Notes (one per line — e.g. “Prefers not to fill honey”)</span>
                <textarea
                  value={s.restrictions.join('\n')}
                  onChange={(e) =>
                    update(s.id, {
                      restrictions: e.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="roster-add link-btn" onClick={addNew}>
          + add a sister
        </button>
        <div className="actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

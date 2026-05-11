import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = {
  target?: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: 'Welcome',
    body:
      'This is the weekly schedule. Each row is a duty (Dinner, Supper, Table, and so on). Each column is a day of the week. The grid starts empty — your first job is to fill in what a normal week looks like, then save it as the default. After that, every new week opens with that pattern already in place.',
  },
  {
    target: '.palette',
    title: 'The sisters',
    body:
      'These names are the sisters. To assign one: click her name on the right, then click a cell. To remove her, click her name inside the cell. To add a SECOND sister to the same cell — Doctor trips with two riders, a four-person honey crew, a cleaning team — click the small "+ add" button that appears in the cell, or hold Shift and click. Use "Manage sisters" to add new people or rename someone.',
  },
  {
    target: '.grid',
    title: 'Honey crew, cleaning, library, meetings',
    body:
      'Cells can hold more than one person. For honey: assign 2–4 sisters and pick each one\'s job (Mix / Fill / Labels / Lids) next to her chip. For Cleaning, Library, or Meetings — same flow, multiple sisters per cell. To say WHICH area is being cleaned (chapel, kitchen, refectory…), right-click the cell and add a note — it prints on the schedule.',
  },
  {
    target: '.grid',
    title: 'AM, PM, or all day',
    body:
      'Under every filled cell there\'s a small "all day" / AM / PM toggle. Click to cycle. Use it when afternoon work is flexible, or when a doctor trip is morning-only (Redway / Garberville) and the sister can still work that PM. Cook + table on the same day is now expected, not flagged.',
  },
  {
    target: '.context-strip',
    title: 'Day of solitude, soup, appointments',
    body:
      'Above the grid: set the quiet day for this week, mark soup days, and add doctor appointments by clicking the + on the day. Each appointment lets you pick All-day (Eureka / Santa Rosa) or AM-only (Redway / Garberville) so PM work isn\'t accidentally cleared.',
  },
  {
    target: '.conflict-summary',
    title: 'Warnings',
    body:
      'As you assign sisters, the system flags real mistakes — a sister double-booked on a day, the wrong sister for a role (Annette on dinner, Gertrude on laundry), Eucharist clashes. Red text in a cell and the count up here mean a real conflict to fix. Soft gold text means a TODO reminder, not a mistake.',
  },
  {
    target: '.palette-actions',
    title: 'Save your standard week',
    body:
      'Once you have a typical week filled in the way you like it, click "Set as default". The app remembers it as your standing pattern and uses it to pre-fill every new week. A backup file also downloads automatically — keep it somewhere safe in case your browser data ever gets cleared.',
  },
  {
    target: '.palette-actions',
    title: 'Each week from now on',
    body:
      'Open the app, the standing pattern is already there, you just adjust this week’s exceptions. Reset to default restores it any time. Clear all gives you a blank week (retreats, holidays). Print schedule produces a one-page version for the kitchen wall. Reopen this tour from the Show tour button.',
  },
];

export function Tour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const flagAdvance = () => {
    setJustAdvanced(true);
    window.setTimeout(() => setJustAdvanced(false), 350);
  };

  useEffect(() => {
    if (!cur.target) return;
    const el = document.querySelector<HTMLElement>(cur.target);
    if (!el) return;
    el.classList.add('tour-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return () => el.classList.remove('tour-highlight');
  }, [cur.target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLast) onClose();
        else {
          setStep((s) => s + 1);
          flagAdvance();
        }
      }
      if (e.key === 'ArrowLeft' && step > 0) {
        e.preventDefault();
        setStep((s) => s - 1);
        flagAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, isLast, onClose]);

  return createPortal(
    <div className="tour no-print">
      <div className="tour-backdrop" />
      <div className="tour-card" role="dialog" aria-label={`Tour step ${step + 1}: ${cur.title}`}>
        <div className="tour-step-num">
          Step {step + 1} of {STEPS.length}
        </div>
        <h3>{cur.title}</h3>
        <p>{cur.body}</p>
        <div className="tour-actions">
          <button onClick={onClose} className="tour-skip">
            Skip tour
          </button>
          <div className="tour-nav">
            {step > 0 && (
              <button
                onClick={(e) => {
                  setStep((s) => s - 1);
                  flagAdvance();
                  (e.currentTarget as HTMLButtonElement).blur();
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={(e) => {
                if (isLast) onClose();
                else {
                  setStep((s) => s + 1);
                  flagAdvance();
                }
                (e.currentTarget as HTMLButtonElement).blur();
              }}
              className={`tour-next ${justAdvanced ? 'just-advanced' : ''}`}
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

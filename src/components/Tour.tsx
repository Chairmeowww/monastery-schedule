import { useEffect, useState } from 'react';

type Step = {
  target?: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: 'Welcome',
    body:
      'This is the weekly schedule. Each row is a duty (Dinner, Supper, Table, and so on). Each column is a day of the week. The grid starts with the standing pattern already filled in — so you only need to adjust this week’s changes.',
  },
  {
    target: '.palette',
    title: 'The sisters',
    body:
      'These nine names are the sisters. The small number after each name (Suz · 2) shows how many duties she has this week.',
  },
  {
    target: '.grid',
    title: 'Placing a sister',
    body:
      'To assign someone to a duty: click her name on the right, then click a cell. To remove her, click her name inside the cell. To add a note to a cell, right-click it.',
  },
  {
    target: '.conflict-summary',
    title: 'Conflicts',
    body:
      'When two rules clash — for example, a sister scheduled twice on the same day — a soft-red note appears inside the affected cell, and the count goes up here. When it says “Schedule is clear,” you’re done. Click any red note to dismiss it with a reason.',
  },
  {
    target: '.context-strip',
    title: 'This week’s context',
    body:
      'Set the day of solitude, choose which days are soup days, and add any doctor appointments. The schedule re-checks itself as you change them.',
  },
  {
    target: '.palette-actions',
    title: 'Printing',
    body:
      'When the week looks right, click “Print schedule” to print a calm one-page schedule for the kitchen wall. You can reopen this tour anytime from the “Show tour” button.',
  },
];

export function Tour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

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
        else setStep((s) => s + 1);
      }
      if (e.key === 'ArrowLeft' && step > 0) {
        e.preventDefault();
        setStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, isLast, onClose]);

  return (
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
            {step > 0 && <button onClick={() => setStep((s) => s - 1)}>Back</button>}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="tour-next"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Sister } from '../types';

type Props = {
  sister: Sister;
  count?: number;        // assignment count this week
  showCount?: boolean;
  hasAppointment?: boolean;
  onSolitude?: boolean;
  selected?: boolean;
  assignedHere?: boolean;
  dim?: boolean;
  tip?: string;
  onClick?: () => void;
};

export function SisterChip({
  sister,
  count,
  showCount,
  hasAppointment,
  onSolitude,
  selected,
  assignedHere,
  dim,
  tip,
  onClick,
}: Props) {
  const cls = [
    'chip',
    'tip',
    selected ? 'selected' : '',
    assignedHere ? 'assigned-here' : '',
    dim || onSolitude ? 'dim' : '',
    sister.isManager ? 'manager' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} data-tip={tip} onClick={onClick} role={onClick ? 'button' : undefined}>
      <span>{sister.name}</span>
      {showCount && count != null && count > 0 && <span className="count">· {count}</span>}
      {hasAppointment && <span className="marker">·dr</span>}
    </span>
  );
}

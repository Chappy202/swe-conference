import { Status } from '../types/dispute';

/** Props for the StatusLifecycle component. */
export interface StatusLifecycleProps {
  /** The dispute's current status. */
  status: Status;
}

/** The canonical forward path a dispute travels. */
const MAIN_PATH: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved'];

/** When a dispute is referred back, it leaves the main path at Under Investigation. */
const REFERRED_PATH: Status[] = ['Reported', 'UnderInvestigation', 'Referred'];

const STAGE_LABELS: Record<Status, string> = {
  Reported: 'Reported',
  UnderInvestigation: 'Under Investigation',
  Escalated: 'Escalated',
  Resolved: 'Resolved',
  Referred: 'Referred',
};

type NodeState = 'done' | 'current' | 'upcoming';

function circleClasses(state: NodeState, stage: Status): string {
  if (state === 'done') {
    return 'bg-[#003366] text-white';
  }
  if (state === 'current') {
    if (stage === 'Resolved') return 'bg-emerald-600 text-white ring-4 ring-emerald-100';
    if (stage === 'Referred') return 'bg-slate-500 text-white ring-4 ring-slate-100';
    return 'bg-[#003366] text-white ring-4 ring-blue-100';
  }
  return 'border border-slate-300 bg-white text-slate-400';
}

function labelClasses(state: NodeState): string {
  if (state === 'current') return 'font-semibold text-slate-900';
  if (state === 'done') return 'text-slate-600';
  return 'text-slate-400';
}

/**
 * Horizontal progress path showing where a dispute sits in its lifecycle.
 * Read together with the status action buttons (which expose the available
 * transitions), this satisfies the "lifecycle indicator" requirement: current
 * position here, available next steps in the adjacent action buttons.
 */
export function StatusLifecycle({ status }: StatusLifecycleProps) {
  const stages = status === 'Referred' ? REFERRED_PATH : MAIN_PATH;
  const currentIndex = stages.indexOf(status);
  const isTerminal = status === 'Resolved' || status === 'Referred';

  return (
    <section
      data-testid="status-lifecycle"
      aria-label="Dispute lifecycle"
      className="rounded-card border border-slate-200 bg-white px-6 py-4 shadow-sm"
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Lifecycle</p>
      <ol className="flex items-start">
        {stages.map((stage, index) => {
          const state: NodeState =
            index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <li
              key={stage}
              data-testid={`lifecycle-stage-${stage}`}
              aria-current={state === 'current' ? 'step' : undefined}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    index <= currentIndex ? 'bg-[#003366]' : 'bg-slate-200'
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${circleClasses(
                  state,
                  stage
                )}`}
              >
                {state === 'done' ? '✓' : index + 1}
              </span>
              <span className={`mt-2 px-1 text-xs ${labelClasses(state)}`}>
                {STAGE_LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>
      {isTerminal && (
        <p className="mt-3 text-xs text-slate-500">This case is closed — no further actions.</p>
      )}
    </section>
  );
}

import { Priority } from '../types/dispute';

/** Props for the TriageRecommendationCard component. */
export interface TriageRecommendationCardProps {
  /** The recommendation text produced by the triage engine. */
  recommendation: string;
  /** The priority level determining the left border colour. */
  priority: Priority;
}

const PRIORITY_COLOURS: Record<Priority, { badge: string; border: string }> = {
  P1: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-600' },
  P2: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  Standard: { badge: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' },
};

export function TriageRecommendationCard({
  recommendation,
  priority,
}: TriageRecommendationCardProps): React.ReactElement {
  const borderClass = PRIORITY_COLOURS[priority].border;

  return (
    <div
      data-testid="triage-recommendation"
      className={`border-l-4 ${borderClass} p-4 bg-white rounded shadow-sm`}
    >
      <p className="font-bold">{recommendation}</p>
    </div>
  );
}

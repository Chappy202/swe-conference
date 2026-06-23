import { useState } from 'react';
import { RuleTrace } from '../types/dispute';

export interface RuleTraceSectionProps {
  ruleTrace: RuleTrace;
}

export function RuleTraceSection({ ruleTrace }: RuleTraceSectionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section data-testid="rule-trace-section" className="rounded-lg border border-gray-200 bg-white">
      <button
        data-testid="rule-trace-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-50"
        aria-expanded={isExpanded}
      >
        <span>Rule Trace</span>
        <span className="text-sm text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Evaluated at:</span> {ruleTrace.evaluatedAt}
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-700">Inputs</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Youngest Transaction Age:</dt>
              <dd className="text-gray-900">{ruleTrace.inputs.youngestTransactionAge}</dd>
              <dt className="text-gray-500">Total Amount:</dt>
              <dd className="text-gray-900">{ruleTrace.inputs.totalAmount}</dd>
            </dl>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Rules</h4>
            <ul className="space-y-2">
              {ruleTrace.rules.map((entry, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span
                    className={`font-bold ${entry.result ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {entry.result ? '✓' : '✗'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-800">{entry.rule}</div>
                    <div className="text-gray-500">{entry.condition}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <span className="text-sm font-medium text-gray-700">Recommendation:</span>{' '}
            <span className="text-sm font-semibold text-gray-900">
              {ruleTrace.recommendation}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

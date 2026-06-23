import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../src/components/StatusBadge';
import type { Status } from '../src/types';

describe('StatusBadge', () => {
  const cases: Array<{ status: Status; label: string; classes: string[] }> = [
    { status: 'Reported', label: 'Reported', classes: ['bg-blue-100', 'text-blue-700'] },
    {
      status: 'UnderInvestigation',
      label: 'Under Investigation',
      classes: ['bg-violet-100', 'text-violet-700'],
    },
    { status: 'Escalated', label: 'Escalated', classes: ['bg-amber-100', 'text-amber-700'] },
    { status: 'Resolved', label: 'Resolved', classes: ['bg-emerald-100', 'text-emerald-700'] },
    { status: 'Referred', label: 'Referred', classes: ['bg-gray-100', 'text-gray-700'] },
  ];

  cases.forEach(({ status, label, classes }) => {
    describe(`when status is ${status}`, () => {
      it(`should render the label "${label}"`, () => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      it(`should apply classes ${classes.join(' ')}`, () => {
        render(<StatusBadge status={status} />);
        const badge = screen.getByText(label);
        classes.forEach((cls) => expect(badge).toHaveClass(cls));
      });
    });
  });
});

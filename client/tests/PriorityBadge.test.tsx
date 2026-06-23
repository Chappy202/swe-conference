import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../src/components/PriorityBadge';
import type { Priority } from '../src/types';

describe('PriorityBadge', () => {
  const cases: Array<{ priority: Priority; classes: string[] }> = [
    { priority: 'P1', classes: ['bg-red-100', 'text-red-700'] },
    { priority: 'P2', classes: ['bg-amber-100', 'text-amber-700'] },
    { priority: 'Standard', classes: ['bg-gray-100', 'text-gray-700'] },
  ];

  cases.forEach(({ priority, classes }) => {
    describe(`when priority is ${priority}`, () => {
      it(`should render the text "${priority}"`, () => {
        render(<PriorityBadge priority={priority} />);
        expect(screen.getByText(priority)).toBeInTheDocument();
      });

      it(`should apply classes ${classes.join(' ')}`, () => {
        render(<PriorityBadge priority={priority} />);
        const badge = screen.getByText(priority);
        classes.forEach((cls) => expect(badge).toHaveClass(cls));
      });
    });
  });
});

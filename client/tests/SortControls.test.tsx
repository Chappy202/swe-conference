import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortControls } from '../src/components/SortControls';

function renderControls(overrides: Partial<Parameters<typeof SortControls>[0]> = {}) {
  const props = {
    sortBy: 'priority' as const,
    sortOrder: 'desc' as const,
    onSortByChange: vi.fn(),
    onSortOrderChange: vi.fn(),
    ...overrides,
  };
  render(<SortControls {...props} />);
  return props;
}

describe('SortControls', () => {
  describe('sort field dropdown', () => {
    it('should render options for Date Raised, Total Amount, and Priority', () => {
      renderControls();
      const select = screen.getByTestId('sort-field');
      const optionLabels = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
      expect(optionLabels).toEqual(['Date Raised', 'Total Amount', 'Priority']);
    });

    it('should reflect the current sort field', () => {
      renderControls({ sortBy: 'totalAmount' });
      expect((screen.getByTestId('sort-field') as HTMLSelectElement).value).toBe('totalAmount');
    });

    it('should call onSortByChange when a different field is selected', () => {
      const { onSortByChange } = renderControls();
      fireEvent.change(screen.getByTestId('sort-field'), { target: { value: 'dateRaised' } });
      expect(onSortByChange).toHaveBeenCalledWith('dateRaised');
    });
  });

  describe('sort direction toggle', () => {
    it('should render a direction toggle button with an accessible label', () => {
      renderControls();
      const button = screen.getByTestId('sort-direction');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should call onSortOrderChange with asc when currently desc', () => {
      const { onSortOrderChange } = renderControls({ sortOrder: 'desc' });
      fireEvent.click(screen.getByTestId('sort-direction'));
      expect(onSortOrderChange).toHaveBeenCalledWith('asc');
    });

    it('should call onSortOrderChange with desc when currently asc', () => {
      const { onSortOrderChange } = renderControls({ sortOrder: 'asc' });
      fireEvent.click(screen.getByTestId('sort-direction'));
      expect(onSortOrderChange).toHaveBeenCalledWith('desc');
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResolutionOutcomeDisplay } from '../../src/components/ResolutionOutcomeDisplay';

describe('ResolutionOutcomeDisplay', () => {
  it('renders with data-testid="resolution-outcome"', () => {
    render(<ResolutionOutcomeDisplay outcome="Refunded" />);
    expect(screen.getByTestId('resolution-outcome')).toBeInTheDocument();
  });

  it('displays "Refunded" outcome as a labelled field', () => {
    render(<ResolutionOutcomeDisplay outcome="Refunded" />);
    const container = screen.getByTestId('resolution-outcome');
    expect(container).toHaveTextContent('Resolution Outcome');
    expect(container).toHaveTextContent('Refunded');
  });

  it('displays "Declined" outcome as a labelled field', () => {
    render(<ResolutionOutcomeDisplay outcome="Declined" />);
    const container = screen.getByTestId('resolution-outcome');
    expect(container).toHaveTextContent('Resolution Outcome');
    expect(container).toHaveTextContent('Declined');
  });

  it('displays "ChargebackInitiated" outcome as a labelled field', () => {
    render(<ResolutionOutcomeDisplay outcome="ChargebackInitiated" />);
    const container = screen.getByTestId('resolution-outcome');
    expect(container).toHaveTextContent('Resolution Outcome');
    expect(container).toHaveTextContent('Chargeback Initiated');
  });
});

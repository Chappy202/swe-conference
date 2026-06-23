import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusLifecycle } from '../../src/components/StatusLifecycle';

describe('StatusLifecycle', () => {
  it('renders the lifecycle container', () => {
    render(<StatusLifecycle status="Reported" />);
    expect(screen.getByTestId('status-lifecycle')).toBeInTheDocument();
  });

  it('marks the current stage with aria-current="step"', () => {
    render(<StatusLifecycle status="UnderInvestigation" />);
    const current = screen.getByTestId('lifecycle-stage-UnderInvestigation');
    expect(current).toHaveAttribute('aria-current', 'step');
  });

  it('shows the four main stages for a dispute on the main path', () => {
    render(<StatusLifecycle status="Escalated" />);
    expect(screen.getByTestId('lifecycle-stage-Reported')).toBeInTheDocument();
    expect(screen.getByTestId('lifecycle-stage-UnderInvestigation')).toBeInTheDocument();
    expect(screen.getByTestId('lifecycle-stage-Escalated')).toBeInTheDocument();
    expect(screen.getByTestId('lifecycle-stage-Resolved')).toBeInTheDocument();
    expect(screen.queryByTestId('lifecycle-stage-Referred')).not.toBeInTheDocument();
  });

  it('shows the referred branch instead of escalate/resolve when referred', () => {
    render(<StatusLifecycle status="Referred" />);
    expect(screen.getByTestId('lifecycle-stage-Referred')).toBeInTheDocument();
    expect(screen.queryByTestId('lifecycle-stage-Escalated')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lifecycle-stage-Resolved')).not.toBeInTheDocument();
  });

  it('notes that the case is closed for terminal statuses', () => {
    render(<StatusLifecycle status="Resolved" />);
    expect(screen.getByText(/case is closed/i)).toBeInTheDocument();
  });

  it('does not show the closed note while the case is active', () => {
    render(<StatusLifecycle status="Reported" />);
    expect(screen.queryByText(/case is closed/i)).not.toBeInTheDocument();
  });
});

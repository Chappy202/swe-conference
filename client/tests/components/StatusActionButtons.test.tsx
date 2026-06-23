import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusActionButtons } from '../../src/components/StatusActionButtons';
import { Status } from '../../src/types/dispute';

describe('StatusActionButtons', () => {
  const defaultProps = {
    status: 'Reported' as Status,
    disputeId: 42,
    onActionComplete: vi.fn(),
    onResolveClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
    );
  });

  describe('when status is Reported', () => {
    it('should render Begin Investigation button', () => {
      render(<StatusActionButtons {...defaultProps} status="Reported" />);
      expect(screen.getByTestId('action-investigate')).toBeInTheDocument();
      expect(screen.getByTestId('action-investigate')).toHaveTextContent('Begin Investigation');
    });

    it('should not render Escalate, Resolve, or Refer buttons', () => {
      render(<StatusActionButtons {...defaultProps} status="Reported" />);
      expect(screen.queryByTestId('action-escalate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-resolve')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-refer')).not.toBeInTheDocument();
    });
  });

  describe('when status is UnderInvestigation', () => {
    it('should render Escalate, Resolve, and Refer buttons', () => {
      render(<StatusActionButtons {...defaultProps} status="UnderInvestigation" />);
      expect(screen.getByTestId('action-escalate')).toBeInTheDocument();
      expect(screen.getByTestId('action-resolve')).toBeInTheDocument();
      expect(screen.getByTestId('action-refer')).toBeInTheDocument();
    });

    it('should not render Begin Investigation button', () => {
      render(<StatusActionButtons {...defaultProps} status="UnderInvestigation" />);
      expect(screen.queryByTestId('action-investigate')).not.toBeInTheDocument();
    });
  });

  describe('when status is Escalated', () => {
    it('should render only the Resolve button', () => {
      render(<StatusActionButtons {...defaultProps} status="Escalated" />);
      expect(screen.getByTestId('action-resolve')).toBeInTheDocument();
      expect(screen.queryByTestId('action-investigate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-escalate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-refer')).not.toBeInTheDocument();
    });
  });

  describe('when status is terminal (Resolved or Referred)', () => {
    it('should render no buttons for Resolved', () => {
      const { container } = render(<StatusActionButtons {...defaultProps} status="Resolved" />);
      expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('should render no buttons for Referred', () => {
      const { container } = render(<StatusActionButtons {...defaultProps} status="Referred" />);
      expect(container.querySelectorAll('button')).toHaveLength(0);
    });
  });

  describe('when a direct transition button is clicked', () => {
    it('should call PATCH /api/disputes/:id/status and onActionComplete on success', async () => {
      const onActionComplete = vi.fn();
      render(
        <StatusActionButtons
          {...defaultProps}
          status="Reported"
          onActionComplete={onActionComplete}
        />
      );

      fireEvent.click(screen.getByTestId('action-investigate'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/disputes/42/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'UnderInvestigation' }),
        });
      });

      await waitFor(() => {
        expect(onActionComplete).toHaveBeenCalled();
      });
    });
  });

  describe('when the Resolve button is clicked', () => {
    it('should call onResolveClick instead of making an API call', () => {
      const onResolveClick = vi.fn();
      render(
        <StatusActionButtons
          {...defaultProps}
          status="UnderInvestigation"
          onResolveClick={onResolveClick}
        />
      );

      fireEvent.click(screen.getByTestId('action-resolve'));

      expect(onResolveClick).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('when an API call is in progress', () => {
    it('should show a spinner and disable all buttons', async () => {
      // Make fetch hang (never resolve)
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      render(<StatusActionButtons {...defaultProps} status="UnderInvestigation" />);

      fireEvent.click(screen.getByTestId('action-escalate'));

      await waitFor(() => {
        expect(screen.getByTestId('action-loading')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('when an API call fails', () => {
    it('should display an error notification', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'INVALID_STATUS_TRANSITION' }),
          } as unknown as Response)
        )
      );

      render(<StatusActionButtons {...defaultProps} status="Reported" />);

      fireEvent.click(screen.getByTestId('action-investigate'));

      await waitFor(() => {
        expect(screen.getByTestId('action-error')).toBeInTheDocument();
        expect(screen.getByTestId('action-error')).toHaveTextContent(
          'Failed to update status: INVALID_STATUS_TRANSITION.'
        );
      });
    });
  });
});

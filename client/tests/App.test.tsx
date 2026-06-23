import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

/**
 * The dashboard and create-form pages fetch JSON arrays on mount. Stub fetch
 * with an empty array so they render their chrome (headings, buttons) without
 * a network round-trip.
 */
function stubEmptyArrayFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    )
  );
}

describe('App', () => {
  beforeEach(() => {
    stubEmptyArrayFetch();
  });

  describe('when navigating to /', () => {
    it('renders the dashboard heading', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      expect(await screen.findByRole('heading', { name: /all disputes/i })).toBeInTheDocument();
    });

    it('renders the New Dispute button', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      expect(await screen.findByTestId('new-dispute-button')).toBeInTheDocument();
    });
  });

  describe('when navigating to /disputes/new', () => {
    it('renders the create dispute form', async () => {
      render(
        <MemoryRouter initialEntries={['/disputes/new']}>
          <App />
        </MemoryRouter>
      );
      expect(
        await screen.findByRole('heading', { name: /create new dispute/i })
      ).toBeInTheDocument();
    });
  });

  describe('when navigating to /disputes/:id', () => {
    it('renders the dispute detail page', () => {
      render(
        <MemoryRouter initialEntries={['/disputes/1']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId('dispute-detail-page')).toBeInTheDocument();
    });
  });
});

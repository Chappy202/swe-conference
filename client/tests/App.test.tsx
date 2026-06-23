import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App', () => {
  describe('when navigating to /', () => {
    it('renders the app heading', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      expect(
        await screen.findByRole('heading', { name: /node conf starter/i })
      ).toBeInTheDocument();
    });

    it('renders the increment button', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      expect(await screen.findByRole('button', { name: /increment/i })).toBeInTheDocument();
    });

    it('shows the backend health status once loaded', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      // fetch is stubbed in tests/setup.ts to return { status: 'healthy' }
      expect(await screen.findByText('healthy')).toBeInTheDocument();
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

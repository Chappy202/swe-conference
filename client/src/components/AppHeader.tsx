import { Link } from 'react-router-dom';

/**
 * Global application header shown on every page. The brand mark links back to
 * the dashboard. Keeps the fixed 16-unit height and Standard Bank navy used
 * across the product.
 */
export function AppHeader() {
  return (
    <header
      data-testid="app-header"
      className="flex h-16 items-center bg-[#003366] px-6 text-white"
    >
      <Link
        to="/"
        data-testid="app-header-brand"
        className="flex items-baseline gap-2 transition-opacity hover:opacity-90"
      >
        <span className="text-lg font-semibold tracking-tight">Dispute Triage</span>
        <span className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-white/55 sm:inline">
          Standard Bank · Operations
        </span>
      </Link>
    </header>
  );
}

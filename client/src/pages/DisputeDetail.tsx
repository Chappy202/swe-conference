import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDisputeDetail } from '../hooks/useDisputeDetail';
import { AppHeader } from '../components/AppHeader';
import { CustomerInfoCard } from '../components/CustomerInfoCard';
import { DisputeSummaryCard } from '../components/DisputeSummaryCard';
import { TriageRecommendationCard } from '../components/TriageRecommendationCard';
import { RuleTraceSection } from '../components/RuleTraceSection';
import { TransactionsTable } from '../components/TransactionsTable';
import { StatusActionButtons } from '../components/StatusActionButtons';
import { ResolutionOutcomeModal } from '../components/ResolutionOutcomeModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { ResolutionOutcomeDisplay } from '../components/ResolutionOutcomeDisplay';

/** Page component for dispute detail view at route /disputes/:id. */
function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const navigate = useNavigate();
  const { dispute, isLoading, error, notFound, refetch } = useDisputeDetail(numericId);

  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  return (
    <div data-testid="dispute-detail-page" className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {isLoading && (
          <div data-testid="loading-state" className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="h-32 w-full rounded-card bg-slate-200" />
                <div className="h-48 w-full rounded-card bg-slate-200" />
              </div>
              <div className="h-64 w-full rounded-card bg-slate-200" />
            </div>
          </div>
        )}

        {!isLoading && notFound && (
          <div data-testid="not-found-state" className="py-16 text-center">
            <p className="text-lg text-slate-700">Dispute not found.</p>
            <Link to="/" className="mt-4 inline-block font-medium text-[#003366] hover:underline">
              Back to Dashboard
            </Link>
          </div>
        )}

        {!isLoading && !notFound && error && (
          <div data-testid="error-state">
            <div className="rounded-card border border-red-200 bg-red-50 p-4 text-red-700">
              <p>Failed to load dispute details. Please try again.</p>
              <button
                onClick={refetch}
                className="mt-3 rounded-button bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !notFound && !error && dispute && (
          <>
            <nav className="mb-4">
              <Link
                to="/"
                data-testid="back-to-dashboard"
                className="text-sm font-medium text-[#003366] hover:underline"
              >
                ← Back to Dashboard
              </Link>
            </nav>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Dispute
                </p>
                <h1
                  data-testid="dispute-title"
                  className="text-3xl font-bold tracking-tight text-slate-900"
                >
                  Dispute #{id}
                </h1>
              </div>
              <StatusActionButtons
                status={dispute.status}
                disputeId={dispute.id}
                onActionComplete={refetch}
                onResolveClick={() => setIsResolutionModalOpen(true)}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column — the decision and supporting evidence. */}
              <div className="space-y-6 lg:col-span-2">
                <TriageRecommendationCard
                  recommendation={dispute.recommendation}
                  priority={dispute.priority}
                />

                <section className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-700">Transactions</h2>
                  </div>
                  <div className="p-4">
                    <TransactionsTable
                      transactions={dispute.transactions}
                      status={dispute.status}
                      onAddTransaction={() => setIsAddTransactionModalOpen(true)}
                    />
                  </div>
                </section>

                <RuleTraceSection ruleTrace={dispute.ruleTrace} />
              </div>

              {/* Right column — the facts at a glance. */}
              <aside className="space-y-6">
                <DisputeSummaryCard
                  status={dispute.status}
                  priority={dispute.priority}
                  category={dispute.category}
                  totalAmount={dispute.totalAmount}
                  dateRaised={dispute.dateRaised}
                />

                <CustomerInfoCard customer={dispute.customer} />

                {dispute.status === 'Resolved' && dispute.resolutionOutcome && (
                  <ResolutionOutcomeDisplay outcome={dispute.resolutionOutcome} />
                )}
              </aside>
            </div>

            <ResolutionOutcomeModal
              isOpen={isResolutionModalOpen}
              disputeId={dispute.id}
              onClose={() => setIsResolutionModalOpen(false)}
              onResolved={() => navigate('/')}
            />

            <AddTransactionModal
              isOpen={isAddTransactionModalOpen}
              disputeId={dispute.id}
              onClose={() => setIsAddTransactionModalOpen(false)}
              onAdded={refetch}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default DisputeDetailPage;

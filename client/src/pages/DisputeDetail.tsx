import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDisputeDetail } from '../hooks/useDisputeDetail';
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
  const { dispute, isLoading, error, notFound, refetch } = useDisputeDetail(numericId);

  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div data-testid="dispute-detail-page">
        <div data-testid="loading-state" className="animate-pulse space-y-4 p-6">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div data-testid="dispute-detail-page">
        <div data-testid="not-found-state" className="p-6 text-center">
          <p className="text-lg text-gray-700">Dispute not found.</p>
          <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="dispute-detail-page">
        <div data-testid="error-state" className="p-6">
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
            <p>Failed to load dispute details. Please try again.</p>
            <button
              onClick={refetch}
              className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return null;
  }

  return (
    <div data-testid="dispute-detail-page" className="space-y-6 p-6">
      <Link
        to="/"
        data-testid="back-to-dashboard"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 data-testid="dispute-title" className="text-2xl font-bold text-gray-900">
          Dispute #{id}
        </h1>
        <StatusActionButtons
          status={dispute.status}
          disputeId={dispute.id}
          onActionComplete={refetch}
          onResolveClick={() => setIsResolutionModalOpen(true)}
        />
      </div>

      <CustomerInfoCard customer={dispute.customer} />

      <DisputeSummaryCard
        status={dispute.status}
        priority={dispute.priority}
        category={dispute.category}
        totalAmount={dispute.totalAmount}
        dateRaised={dispute.dateRaised}
      />

      <TriageRecommendationCard
        recommendation={dispute.recommendation}
        priority={dispute.priority}
      />

      <RuleTraceSection ruleTrace={dispute.ruleTrace} />

      <TransactionsTable
        transactions={dispute.transactions}
        status={dispute.status}
        onAddTransaction={() => setIsAddTransactionModalOpen(true)}
      />

      {dispute.status === 'Resolved' && dispute.resolutionOutcome && (
        <ResolutionOutcomeDisplay outcome={dispute.resolutionOutcome} />
      )}

      <ResolutionOutcomeModal
        isOpen={isResolutionModalOpen}
        disputeId={dispute.id}
        onClose={() => setIsResolutionModalOpen(false)}
        onResolved={refetch}
      />

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        disputeId={dispute.id}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onAdded={refetch}
      />
    </div>
  );
}

export default DisputeDetailPage;

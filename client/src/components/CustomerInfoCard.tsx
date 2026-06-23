/** Props for the CustomerInfoCard component. */
export interface CustomerInfoCardProps {
  customer: {
    name: string;
    contactReference: string;
    accountIdentifier: string;
  };
}

/** Displays customer name, contact reference, and account identifier. */
export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  return (
    <div
      data-testid="customer-info-card"
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Customer
      </h2>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Name</dt>
          <dd className="font-medium text-gray-900">{customer.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Contact Reference</dt>
          <dd className="font-medium text-gray-900">{customer.contactReference}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Account Identifier</dt>
          <dd className="font-medium text-gray-900">{customer.accountIdentifier}</dd>
        </div>
      </dl>
    </div>
  );
}

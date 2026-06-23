import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;

interface RuleTrace {
  evaluatedAt: string;
  inputs: {
    youngestTransactionAge: string;
    totalAmount: number;
  };
  rules: Array<{
    rule: string;
    condition: string;
    result: boolean;
    detail: string;
  }>;
  recommendation: string;
  priority: string;
}

function buildRuleTrace(
  youngestAgeHours: number,
  totalAmount: number,
  ageRuleFires: boolean,
  amountRuleFires: boolean,
  priority: string,
  recommendation: string
): string {
  const trace: RuleTrace = {
    evaluatedAt: new Date(NOW).toISOString(),
    inputs: {
      youngestTransactionAge: `${youngestAgeHours} hours`,
      totalAmount,
    },
    rules: [
      {
        rule: 'R1',
        condition: 'Transaction age < 48 hours',
        result: ageRuleFires,
        detail: `Youngest transaction is ${youngestAgeHours} hours old`,
      },
      {
        rule: 'R2',
        condition: 'Total dispute amount > R10,000',
        result: amountRuleFires,
        detail: `Total amount is R${totalAmount.toLocaleString()}`,
      },
    ],
    recommendation,
    priority,
  };
  return JSON.stringify(trace);
}

async function main(): Promise<void> {
  // 1. Clear data (respecting FK order)
  await prisma.transaction.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Seed customers (South African names)
  const thabo = await prisma.customer.create({
    data: {
      name: 'Thabo Mokoena',
      contactReference: '+27 82 345 6789',
      accountIdentifier: '1234-5678-9012',
    },
  });

  const naledi = await prisma.customer.create({
    data: {
      name: 'Naledi Dlamini',
      contactReference: '+27 71 234 5678',
      accountIdentifier: '2345-6789-0123',
    },
  });

  const sipho = await prisma.customer.create({
    data: {
      name: 'Sipho Nkosi',
      contactReference: '+27 83 456 7890',
      accountIdentifier: '3456-7890-1234',
    },
  });

  const lerato = await prisma.customer.create({
    data: {
      name: 'Lerato Mahlangu',
      contactReference: '+27 72 567 8901',
      accountIdentifier: '4567-8901-2345',
    },
  });

  // 3. Seed disputes with transactions

  // Case A: Transaction < 48h + total > R10,000 → P1, both rules fire
  const caseAAmount = 15000;
  const caseADateRaised = new Date(NOW - 1 * HOUR);
  const caseATxTimestamp = new Date(NOW - 24 * HOUR); // 24h old relative to now, 23h relative to dateRaised

  await prisma.dispute.create({
    data: {
      customerId: thabo.id,
      status: 'UnderInvestigation',
      category: 'Unauthorised/Fraudulent Charge',
      totalAmount: caseAAmount,
      dateRaised: caseADateRaised,
      priority: 'P1',
      recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
      ruleTrace: buildRuleTrace(
        23,
        caseAAmount,
        true,
        true,
        'P1',
        'Immediate Fraud Freeze + P1 High Priority Escalation'
      ),
      resolutionOutcome: null,
      transactions: {
        create: [
          {
            amount: 15000,
            merchant: 'Woolworths Sandton',
            timestamp: caseATxTimestamp,
            paymentType: 'Card',
          },
        ],
      },
    },
  });

  // Case B: Transaction >= 48h + total > R10,000 → P1, amount-only
  const caseBAmount = 25000;
  const caseBDateRaised = new Date(NOW - 1 * HOUR);
  const caseBTxTimestamp = new Date(NOW - 72 * HOUR); // 72h old relative to now, 71h relative to dateRaised

  await prisma.dispute.create({
    data: {
      customerId: naledi.id,
      status: 'Resolved',
      category: 'Unauthorised/Fraudulent Charge',
      totalAmount: caseBAmount,
      dateRaised: caseBDateRaised,
      priority: 'P1',
      recommendation: 'P1 High Priority Escalation',
      ruleTrace: buildRuleTrace(
        71,
        caseBAmount,
        false,
        true,
        'P1',
        'P1 High Priority Escalation'
      ),
      resolutionOutcome: 'Refunded',
      transactions: {
        create: [
          {
            amount: 25000,
            merchant: 'Takealot Online',
            timestamp: caseBTxTimestamp,
            paymentType: 'EFT',
          },
        ],
      },
    },
  });

  // Case C: Transaction < 48h + total <= R10,000 → P2, age-only
  const caseCAmount = 4500;
  const caseCDateRaised = new Date(NOW - 2 * HOUR);
  const caseCTxTimestamp = new Date(NOW - 12 * HOUR); // 12h old relative to now, 10h relative to dateRaised

  await prisma.dispute.create({
    data: {
      customerId: sipho.id,
      status: 'Reported',
      category: 'Unauthorised/Fraudulent Charge',
      totalAmount: caseCAmount,
      dateRaised: caseCDateRaised,
      priority: 'P2',
      recommendation: 'Immediate Fraud Freeze',
      ruleTrace: buildRuleTrace(
        10,
        caseCAmount,
        true,
        false,
        'P2',
        'Immediate Fraud Freeze'
      ),
      resolutionOutcome: null,
      transactions: {
        create: [
          {
            amount: 4500,
            merchant: 'Checkers Rosebank',
            timestamp: caseCTxTimestamp,
            paymentType: 'Card',
          },
        ],
      },
    },
  });

  // Case D: Transaction >= 48h + total <= R10,000 → Standard, neither rule fires
  const caseDAmount = 2500;
  const caseDDateRaised = new Date(NOW - 2 * HOUR);
  const caseDTxTimestamp = new Date(NOW - 96 * HOUR); // 96h old relative to now, 94h relative to dateRaised

  await prisma.dispute.create({
    data: {
      customerId: lerato.id,
      status: 'Resolved',
      category: 'Unauthorised/Fraudulent Charge',
      totalAmount: caseDAmount,
      dateRaised: caseDDateRaised,
      priority: 'Standard',
      recommendation: 'Standard Investigation',
      ruleTrace: buildRuleTrace(
        94,
        caseDAmount,
        false,
        false,
        'Standard',
        'Standard Investigation'
      ),
      resolutionOutcome: 'Declined',
      transactions: {
        create: [
          {
            amount: 2500,
            merchant: 'Engen Garage Midrand',
            timestamp: caseDTxTimestamp,
            paymentType: 'Card',
          },
        ],
      },
    },
  });

  // Case E: Multi-transaction anchor story (phone robbery scenario)
  // Customer robbed at gunpoint, attackers make multiple Apple Pay transactions
  // totalling ~R16,500. Recent transactions + > R10,000 → P1 both rules
  const caseEDateRaised = new Date(NOW - 3 * HOUR);
  const caseETx1 = new Date(NOW - 5 * HOUR); // 5h old, 2h relative to dateRaised
  const caseETx2 = new Date(NOW - 5.5 * HOUR);
  const caseETx3 = new Date(NOW - 6 * HOUR);
  const caseETx4 = new Date(NOW - 6.5 * HOUR);
  const caseEAmounts = [4200, 3800, 5100, 3400];
  const caseETotalAmount = caseEAmounts.reduce((sum, a) => sum + a, 0); // 16500

  await prisma.dispute.create({
    data: {
      customerId: thabo.id,
      status: 'Reported',
      category: 'Unauthorised/Fraudulent Charge',
      totalAmount: caseETotalAmount,
      dateRaised: caseEDateRaised,
      priority: 'P1',
      recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
      ruleTrace: buildRuleTrace(
        2,
        caseETotalAmount,
        true,
        true,
        'P1',
        'Immediate Fraud Freeze + P1 High Priority Escalation'
      ),
      resolutionOutcome: null,
      transactions: {
        create: [
          {
            amount: caseEAmounts[0],
            merchant: 'iStore Gateway',
            timestamp: caseETx1,
            paymentType: 'ApplePay',
          },
          {
            amount: caseEAmounts[1],
            merchant: 'Sportscene Mall of Africa',
            timestamp: caseETx2,
            paymentType: 'ApplePay',
          },
          {
            amount: caseEAmounts[2],
            merchant: 'Edgars Fourways',
            timestamp: caseETx3,
            paymentType: 'ApplePay',
          },
          {
            amount: caseEAmounts[3],
            merchant: 'PnP Liquor Sandton',
            timestamp: caseETx4,
            paymentType: 'ApplePay',
          },
        ],
      },
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

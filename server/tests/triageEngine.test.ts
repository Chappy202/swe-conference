import { describe, it, expect } from 'vitest';
import { evaluateTriage } from '../src/services/triageEngine.js';

interface Transaction {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: 'Card' | 'ApplePay' | 'EFT';
}

describe('TriageEngine', () => {
  // Fixed reference date: 2024-03-15T10:00:00.000Z
  const dateRaised = '2024-03-15T10:00:00.000Z';

  describe('TC-001: when both rules fire (amount > R10K AND age < 48h)', () => {
    it('should return P1 priority with both recommendations', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 5500,
          merchant: 'Woolworths Sandton',
          timestamp: '2024-03-14T08:00:00.000Z', // 26 hours ago — < 48h
          paymentType: 'ApplePay',
        },
        {
          id: 2,
          amount: 3200,
          merchant: 'Checkers Rosebank',
          timestamp: '2024-03-14T12:00:00.000Z', // 22 hours ago — < 48h
          paymentType: 'ApplePay',
        },
        {
          id: 3,
          amount: 7800,
          merchant: 'Takealot Online',
          timestamp: '2024-03-14T15:00:00.000Z', // 19 hours ago — < 48h
          paymentType: 'Card',
        },
      ];
      // Total: R16,500 (> R10K) and youngest transaction is 19 hours (< 48h)

      const result = evaluateTriage(dateRaised, transactions);

      expect(result.priority).toBe('P1');
      expect(result.recommendation).toBe(
        'Immediate Fraud Freeze + P1 High Priority Escalation'
      );
      expect(result.rules).toHaveLength(2);

      const r1 = result.rules.find((r) => r.rule === 'R1');
      const r2 = result.rules.find((r) => r.rule === 'R2');

      expect(r1).toBeDefined();
      expect(r1!.result).toBe(true);
      expect(r1!.condition).toContain('48');

      expect(r2).toBeDefined();
      expect(r2!.result).toBe(true);
      expect(r2!.condition).toContain('10000');

      expect(result.inputs.totalAmount).toBe(16500);
      expect(result.evaluatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('TC-002: when only amount rule fires (> R10K, age >= 48h)', () => {
    it('should return P1 priority with P1 High Priority Escalation', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 8000,
          merchant: 'Game Menlyn',
          timestamp: '2024-03-12T08:00:00.000Z', // 74 hours ago — >= 48h
          paymentType: 'Card',
        },
        {
          id: 2,
          amount: 4500,
          merchant: 'Incredible Connection',
          timestamp: '2024-03-11T10:00:00.000Z', // 96 hours ago — >= 48h
          paymentType: 'Card',
        },
      ];
      // Total: R12,500 (> R10K) and youngest is 74 hours (>= 48h)

      const result = evaluateTriage(dateRaised, transactions);

      expect(result.priority).toBe('P1');
      expect(result.recommendation).toBe('P1 High Priority Escalation');

      const r1 = result.rules.find((r) => r.rule === 'R1');
      const r2 = result.rules.find((r) => r.rule === 'R2');

      expect(r1!.result).toBe(false);
      expect(r2!.result).toBe(true);

      expect(result.inputs.totalAmount).toBe(12500);
    });
  });

  describe('TC-003: when only age rule fires (< 48h, amount <= R10K)', () => {
    it('should return P2 priority with Immediate Fraud Freeze', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 2500,
          merchant: 'Engen Garage Braamfontein',
          timestamp: '2024-03-14T20:00:00.000Z', // 14 hours ago — < 48h
          paymentType: 'ApplePay',
        },
        {
          id: 2,
          amount: 1800,
          merchant: 'Pick n Pay Newtown',
          timestamp: '2024-03-14T21:00:00.000Z', // 13 hours ago — < 48h
          paymentType: 'ApplePay',
        },
      ];
      // Total: R4,300 (<= R10K) and youngest is 13 hours (< 48h)

      const result = evaluateTriage(dateRaised, transactions);

      expect(result.priority).toBe('P2');
      expect(result.recommendation).toBe('Immediate Fraud Freeze');

      const r1 = result.rules.find((r) => r.rule === 'R1');
      const r2 = result.rules.find((r) => r.rule === 'R2');

      expect(r1!.result).toBe(true);
      expect(r2!.result).toBe(false);

      expect(result.inputs.totalAmount).toBe(4300);
    });
  });

  describe('TC-004: when neither rule fires', () => {
    it('should return Standard priority with Standard Investigation', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 3000,
          merchant: 'Spar Melville',
          timestamp: '2024-03-10T08:00:00.000Z', // 122 hours ago — >= 48h
          paymentType: 'EFT',
        },
        {
          id: 2,
          amount: 1500,
          merchant: 'Shell Garage Randburg',
          timestamp: '2024-03-10T12:00:00.000Z', // 118 hours ago — >= 48h
          paymentType: 'Card',
        },
      ];
      // Total: R4,500 (<= R10K) and youngest is 118 hours (>= 48h)

      const result = evaluateTriage(dateRaised, transactions);

      expect(result.priority).toBe('Standard');
      expect(result.recommendation).toBe('Standard Investigation');

      const r1 = result.rules.find((r) => r.rule === 'R1');
      const r2 = result.rules.find((r) => r.rule === 'R2');

      expect(r1!.result).toBe(false);
      expect(r2!.result).toBe(false);

      expect(result.inputs.totalAmount).toBe(4500);
    });
  });

  describe('TC-005: age calculation uses dateRaised, not current time', () => {
    it('should calculate transaction age relative to dateRaised', () => {
      // dateRaised is 2024-03-15T10:00:00.000Z
      // Transaction at 2024-03-14T12:00:00.000Z is 22 hours before dateRaised
      // Even if "now" is days later, the age should still be 22 hours
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 500,
          merchant: 'Vida e Caffe Sandton',
          timestamp: '2024-03-14T12:00:00.000Z', // exactly 22 hours before dateRaised
          paymentType: 'Card',
        },
      ];

      const result = evaluateTriage(dateRaised, transactions);

      // The age rule should fire because 22 hours < 48 hours
      const r1 = result.rules.find((r) => r.rule === 'R1');
      expect(r1!.result).toBe(true);

      // Verify the youngest transaction age reflects dateRaised-based calculation
      expect(result.inputs.youngestTransactionAge).toContain('22');
    });
  });

  describe('TC-006: any single transaction qualifies for age rule', () => {
    it('should fire age rule when only one of multiple transactions is < 48h', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 2000,
          merchant: 'Makro Crown Mines',
          timestamp: '2024-03-08T10:00:00.000Z', // 168 hours ago — well over 48h
          paymentType: 'Card',
        },
        {
          id: 2,
          amount: 1500,
          merchant: 'Mr Price Eastgate',
          timestamp: '2024-03-09T10:00:00.000Z', // 144 hours ago — over 48h
          paymentType: 'Card',
        },
        {
          id: 3,
          amount: 800,
          merchant: 'Steers Fourways',
          timestamp: '2024-03-15T00:00:00.000Z', // 10 hours ago — < 48h!
          paymentType: 'ApplePay',
        },
      ];
      // Total: R4,300 (<= R10K) but one transaction is < 48h

      const result = evaluateTriage(dateRaised, transactions);

      const r1 = result.rules.find((r) => r.rule === 'R1');
      expect(r1!.result).toBe(true);
      expect(result.priority).toBe('P2');
      expect(result.recommendation).toBe('Immediate Fraud Freeze');
    });
  });

  describe('result structure', () => {
    it('should include evaluatedAt as ISO8601 timestamp', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 100,
          merchant: 'Test Merchant',
          timestamp: '2024-03-10T10:00:00.000Z',
          paymentType: 'Card',
        },
      ];

      const result = evaluateTriage(dateRaised, transactions);

      expect(result.evaluatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      );
    });

    it('should include all rule results with required fields', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          amount: 100,
          merchant: 'Test Merchant',
          timestamp: '2024-03-10T10:00:00.000Z',
          paymentType: 'Card',
        },
      ];

      const result = evaluateTriage(dateRaised, transactions);

      for (const rule of result.rules) {
        expect(rule).toHaveProperty('rule');
        expect(rule).toHaveProperty('condition');
        expect(rule).toHaveProperty('result');
        expect(rule).toHaveProperty('detail');
        expect(typeof rule.rule).toBe('string');
        expect(typeof rule.condition).toBe('string');
        expect(typeof rule.result).toBe('boolean');
        expect(typeof rule.detail).toBe('string');
      }
    });
  });
});

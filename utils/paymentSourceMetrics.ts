import { Transaction } from '../types';

export interface PaymentSourceMetrics {
  counts: Record<string, number>;
  lastUsed: Record<string, string>;
}

/**
 * Derive usage counts and last-used YYYY-MM-DD per payment source.
 * Pure + deterministic for easy testing.
 */
export function computePaymentSourceMetrics(transactions: Transaction[]): PaymentSourceMetrics {
  const counts: Record<string, number> = {};
  const lastUsed: Record<string, string> = {};
  for (const t of transactions) {
    if (!t.paymentSourceId) continue;
    counts[t.paymentSourceId] = (counts[t.paymentSourceId] || 0) + 1;
    const prev = lastUsed[t.paymentSourceId];
    if (!prev || prev < t.date) lastUsed[t.paymentSourceId] = t.date; // lexical compare ok (YYYY-MM-DD)
  }
  return { counts, lastUsed };
}

// Lightweight self-test (rudimentary) executed only when run directly via ts-node/node.
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('paymentSourceMetrics')) {
  const sample: Transaction[] = [
    { id: '1', groupId: 'g', description: 'A', amount: 10, paidById: 'p1', date: '2024-01-01', tag: 'Food', paymentSourceId: 's1', split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] } },
    { id: '2', groupId: 'g', description: 'B', amount: 15, paidById: 'p2', date: '2024-02-01', tag: 'Food', paymentSourceId: 's1', split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] } },
    { id: '3', groupId: 'g', description: 'C', amount: 20, paidById: 'p2', date: '2023-12-15', tag: 'Travel', paymentSourceId: 's2', split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] } },
  ];
  const metrics = computePaymentSourceMetrics(sample);
  // Basic assertions
  if (metrics.counts['s1'] !== 2) console.error('Count fail for s1');
  if (metrics.lastUsed['s1'] !== '2024-02-01') console.error('Last used fail for s1');
  if (metrics.counts['s2'] !== 1) console.error('Count fail for s2');
  if (metrics.lastUsed['s2'] !== '2023-12-15') console.error('Last used fail for s2');
  // eslint-disable-next-line no-console
  console.log('paymentSourceMetrics self-test output:', metrics);
}

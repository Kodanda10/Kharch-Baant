import { describe, it, expect } from 'vitest'
import { computePaymentSourceMetrics } from '../../../utils/paymentSourceMetrics'
import { Transaction } from '../../../types'

describe('computePaymentSourceMetrics', () => {
  it('should return empty metrics for empty transactions', () => {
    const result = computePaymentSourceMetrics([])
    
    expect(result.counts).toEqual({})
    expect(result.lastUsed).toEqual({})
  })

  it('should return empty metrics for transactions without payment sources', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Test 2',
        amount: 200,
        paidById: 'p2',
        date: '2024-01-02',
        tag: 'Travel',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({})
    expect(result.lastUsed).toEqual({})
  })

  it('should compute counts and last used for single payment source', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Test 2',
        amount: 200,
        paidById: 'p2',
        date: '2024-01-02',
        tag: 'Travel',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({ ps1: 2 })
    expect(result.lastUsed).toEqual({ ps1: '2024-01-02' })
  })

  it('should compute counts and last used for multiple payment sources', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Test 2',
        amount: 200,
        paidById: 'p2',
        date: '2024-01-02',
        tag: 'Travel',
        paymentSourceId: 'ps2',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      },
      {
        id: '3',
        groupId: 'g1',
        description: 'Test 3',
        amount: 150,
        paidById: 'p1',
        date: '2024-01-03',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '4',
        groupId: 'g1',
        description: 'Test 4',
        amount: 75,
        paidById: 'p2',
        date: '2023-12-15',
        tag: 'Entertainment',
        paymentSourceId: 'ps2',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({ ps1: 2, ps2: 2 })
    expect(result.lastUsed).toEqual({ 
      ps1: '2024-01-03', // Later date
      ps2: '2024-01-02'  // Later date
    })
  })

  it('should handle mixed transactions with and without payment sources', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Test 2',
        amount: 200,
        paidById: 'p2',
        date: '2024-01-02',
        tag: 'Travel',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      },
      {
        id: '3',
        groupId: 'g1',
        description: 'Test 3',
        amount: 150,
        paidById: 'p1',
        date: '2024-01-03',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({ ps1: 2 })
    expect(result.lastUsed).toEqual({ ps1: '2024-01-03' })
  })

  it('should handle transactions with undefined paymentSourceId', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: undefined,
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({})
    expect(result.lastUsed).toEqual({})
  })

  it('should handle transactions with null paymentSourceId', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: null as any,
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({})
    expect(result.lastUsed).toEqual({})
  })

  it('should handle same payment source used multiple times on same date', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Test 2',
        amount: 200,
        paidById: 'p2',
        date: '2024-01-01',
        tag: 'Travel',
        paymentSourceId: 'ps1',
        split: { mode: 'equal', participants: [{ personId: 'p2', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({ ps1: 2 })
    expect(result.lastUsed).toEqual({ ps1: '2024-01-01' })
  })

  it('should handle empty string paymentSourceId', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Test 1',
        amount: 100,
        paidById: 'p1',
        date: '2024-01-01',
        tag: 'Food',
        paymentSourceId: '',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }] },
        type: 'expense'
      }
    ]
    
    const result = computePaymentSourceMetrics(transactions)
    
    expect(result.counts).toEqual({})
    expect(result.lastUsed).toEqual({})
  })
})

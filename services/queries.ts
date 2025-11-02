import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './apiService'
import type { Group, Transaction, PaymentSource, Person } from '../types'

// Query Keys
export const qk = {
  groups: (personId?: string) => ['groups', personId] as const,
  transactions: (personId?: string) => ['transactions', personId] as const,
  paymentSources: (personId?: string) => ['paymentSources', personId] as const,
  people: (personId?: string) => ['people', personId] as const,
}

// Groups
export const useGroupsQuery = (personId?: string) =>
  useQuery({
    queryKey: qk.groups(personId),
    queryFn: () => api.getGroups(personId),
  })

// Transactions
export const useTransactionsQuery = (personId?: string) =>
  useQuery({
    queryKey: qk.transactions(personId),
    queryFn: () => api.getTransactions(personId),
  })

// Payment Sources
export const usePaymentSourcesQuery = (personId?: string) =>
  useQuery({
    queryKey: qk.paymentSources(personId),
    queryFn: () => api.getPaymentSources(personId),
  })

// People
export const usePeopleQuery = (personId?: string) =>
  useQuery({
    queryKey: qk.people(personId),
    queryFn: () => api.getPeople(personId),
    enabled: !!personId,
  })

// Helper: integrate Supabase realtime with cache updates
export const useRealtimeGroupsBridge = (personId?: string) => {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!personId) return
    const sub = api.subscribeToGroups(personId, (payload: any) => {
      qc.setQueryData<Group[]>(qk.groups(personId), (current = []) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') return [...current, newRow as Group]
        if (eventType === 'UPDATE') return current.map(g => g.id === (newRow as Group).id ? (newRow as Group) : g)
        if (eventType === 'DELETE') return current.filter(g => g.id !== (oldRow as any).id)
        return current
      })
    })
    return () => sub.unsubscribe()
  }, [personId, qc])
}

// Helper: realtime bridge for Transactions
export const useRealtimeTransactionsBridge = (personId?: string) => {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!personId) return
    const sub = api.subscribeToTransactions(personId, (payload: any) => {
      qc.setQueryData<Transaction[]>(qk.transactions(personId), (current = []) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') return [newRow as Transaction, ...current]
        if (eventType === 'UPDATE') return current.map(t => t.id === (newRow as Transaction).id ? (newRow as Transaction) : t)
        if (eventType === 'DELETE') return current.filter(t => t.id !== (oldRow as any).id)
        return current
      })
    })
    return () => sub.unsubscribe()
  }, [personId, qc])
}

// Helper: realtime bridge for Payment Sources
export const useRealtimePaymentSourcesBridge = (personId?: string) => {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!personId) return
    const sub = api.subscribeToPaymentSources(personId, (payload: any) => {
      qc.setQueryData<PaymentSource[]>(qk.paymentSources(personId), (current = []) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') return [newRow as PaymentSource, ...current]
        if (eventType === 'UPDATE') return current.map(ps => ps.id === (newRow as PaymentSource).id ? (newRow as PaymentSource) : ps)
        if (eventType === 'DELETE') return current.filter(ps => ps.id !== (oldRow as any).id)
        return current
      })
    })
    return () => sub.unsubscribe()
  }, [personId, qc])
}

// Helper: realtime bridge for People
export const useRealtimePeopleBridge = (personId?: string) => {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!personId) return
    const sub = api.subscribeToPeople(personId, (payload: any) => {
      qc.setQueryData<Person[]>(qk.people(personId), (current = []) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') return [...current, newRow as Person]
        if (eventType === 'UPDATE') return current.map(p => p.id === (newRow as Person).id ? (newRow as Person) : p)
        if (eventType === 'DELETE') return current.filter(p => p.id !== (oldRow as any).id)
        return current
      })
    })
    return () => sub.unsubscribe()
  }, [personId, qc])
}

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

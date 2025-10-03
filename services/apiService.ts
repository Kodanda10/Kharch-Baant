// SUPABASE-ONLY SERVICE EXPORTS
// This file now acts as a thin facade over the Supabase implementation to keep existing imports stable.
// All mock/in-memory logic has been removed as we are migrating fully to persistent storage.

import { Group, Transaction, PaymentSource, Person } from '../types';
import * as supabaseApi from './supabaseApiService';

// GROUPS
export const getGroups = async (): Promise<Group[]> => supabaseApi.getGroups();
export const addGroup = async (groupData: Omit<Group, 'id'>): Promise<Group> => supabaseApi.addGroup(groupData);
export const updateGroup = async (groupId: string, groupData: Omit<Group, 'id'>): Promise<Group> => supabaseApi.updateGroup(groupId, groupData);

// TRANSACTIONS
export const getTransactions = async (): Promise<Transaction[]> => supabaseApi.getTransactions();
export const addTransaction = async (groupId: string, transactionData: Omit<Transaction, 'id' | 'groupId'>): Promise<Transaction> => supabaseApi.addTransaction(groupId, transactionData);
export const updateTransaction = async (transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'groupId'>>): Promise<Transaction> => supabaseApi.updateTransaction(transactionId, transactionData);
export const deleteTransaction = async (transactionId: string): Promise<{ success: boolean }> => supabaseApi.deleteTransaction(transactionId);

// PAYMENT SOURCES
export const getPaymentSources = async (): Promise<PaymentSource[]> => supabaseApi.getPaymentSources();
export const addPaymentSource = async (sourceData: Omit<PaymentSource, 'id'>): Promise<PaymentSource> => supabaseApi.addPaymentSource(sourceData);

// PEOPLE
export const getPeople = async (): Promise<Person[]> => supabaseApi.getPeople();
export const addPerson = async (personData: Omit<Person, 'id'>): Promise<Person> => supabaseApi.addPerson(personData);

// Utility: simple health check (returns true if groups query works)
export const checkConnection = async (): Promise<boolean> => {
  try {
    await supabaseApi.getGroups();
    return true;
  } catch {
    return false;
  }
};

// Warning helper: can be invoked at app bootstrap to ensure envs are present.
export const assertSupabaseEnvironment = () => {
  const missing: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn('[Supabase] Missing environment variables:', missing.join(', '));
  }
};

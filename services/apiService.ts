import { Group, Transaction, PaymentSource } from '../types';
import { GROUPS, TRANSACTIONS, PAYMENT_SOURCES } from '../constants';

// Smart API routing: Switch between mock and Supabase based on environment
const API_MODE = process.env.REACT_APP_API_MODE || 'mock';

// --- MOCK DATABASE ---
// In a real app, this would be a database. For now, we'll use in-memory arrays.
let mockGroups: Group[] = [...GROUPS];
let mockTransactions: Transaction[] = [...TRANSACTIONS];
let mockPaymentSources: PaymentSource[] = [...PAYMENT_SOURCES];

// --- API SIMULATION ---
// This function simulates network latency.
const simulateLatency = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK API METHODS ---
const mockApiService = {
  // GROUPS
  getGroups: async (): Promise<Group[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockGroups));
  },

  addGroup: async (groupData: Omit<Group, 'id'>): Promise<Group> => {
    await simulateLatency();
    const newGroup: Group = {
      id: `g${Date.now()}`,
      ...groupData,
    };
    mockGroups.push(newGroup);
    return JSON.parse(JSON.stringify(newGroup));
  },

  updateGroup: async (groupId: string, groupData: Omit<Group, 'id'>): Promise<Group> => {
    await simulateLatency();
    let groupToUpdate: Group | undefined;
    mockGroups = mockGroups.map(g => {
      if (g.id === groupId) {
        groupToUpdate = { ...g, ...groupData };
        return groupToUpdate;
      }
      return g;
    });
    if (!groupToUpdate) throw new Error("Group not found");
    return JSON.parse(JSON.stringify(groupToUpdate));
  },

  // TRANSACTIONS
  getTransactions: async (): Promise<Transaction[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockTransactions));
  },

  addTransaction: async (groupId: string, transactionData: Omit<Transaction, 'id' | 'groupId'>): Promise<Transaction> => {
    await simulateLatency();
    const newTransaction: Transaction = {
      id: `t${Date.now()}`,
      groupId,
      ...transactionData,
    };
    mockTransactions.push(newTransaction);
    return JSON.parse(JSON.stringify(newTransaction));
  },

  updateTransaction: async (transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'groupId'>>): Promise<Transaction> => {
    await simulateLatency();
    let transactionToUpdate: Transaction | undefined;
    mockTransactions = mockTransactions.map(t => {
      if (t.id === transactionId) {
        transactionToUpdate = { ...t, ...transactionData };
        return transactionToUpdate;
      }
      return t;
    });
    if (!transactionToUpdate) throw new Error("Transaction not found");
    return JSON.parse(JSON.stringify(transactionToUpdate));
  },

  deleteTransaction: async (transactionId: string): Promise<{ success: boolean }> => {
    await simulateLatency();
    const initialLength = mockTransactions.length;
    mockTransactions = mockTransactions.filter(t => t.id !== transactionId);
    if (mockTransactions.length === initialLength) {
      throw new Error("Transaction not found");
    }
    return { success: true };
  },

  // PAYMENT SOURCES
  getPaymentSources: async (): Promise<PaymentSource[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockPaymentSources));
  },

  addPaymentSource: async (sourceData: Omit<PaymentSource, 'id'>): Promise<PaymentSource> => {
    await simulateLatency();
    const newSource: PaymentSource = {
      id: `ps_${Date.now()}`,
      ...sourceData,
    };
    mockPaymentSources.push(newSource);
    return JSON.parse(JSON.stringify(newSource));
  },
};

// Dynamic API service loader
const getApiService = async () => {
  if (API_MODE === 'supabase') {
    const supabaseApi = await import('./supabaseApiService');
    return supabaseApi;
  }
  return mockApiService;
};

// --- EXPORTED API METHODS ---
// These methods dynamically route to either mock or Supabase API

// GROUPS
export const getGroups = async (): Promise<Group[]> => {
  const api = await getApiService();
  return api.getGroups();
};

export const addGroup = async (groupData: Omit<Group, 'id'>): Promise<Group> => {
  const api = await getApiService();
  return api.addGroup(groupData);
};

export const updateGroup = async (groupId: string, groupData: Omit<Group, 'id'>): Promise<Group> => {
  const api = await getApiService();
  return api.updateGroup(groupId, groupData);
};

// TRANSACTIONS
export const getTransactions = async (): Promise<Transaction[]> => {
  const api = await getApiService();
  return api.getTransactions();
};

export const addTransaction = async (groupId: string, transactionData: Omit<Transaction, 'id' | 'groupId'>): Promise<Transaction> => {
  const api = await getApiService();
  return api.addTransaction(groupId, transactionData);
};

export const updateTransaction = async (transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'groupId'>>): Promise<Transaction> => {
  const api = await getApiService();
  return api.updateTransaction(transactionId, transactionData);
};

export const deleteTransaction = async (transactionId: string): Promise<{ success: boolean }> => {
  const api = await getApiService();
  return api.deleteTransaction(transactionId);
};

// PAYMENT SOURCES
export const getPaymentSources = async (): Promise<PaymentSource[]> => {
  const api = await getApiService();
  return api.getPaymentSources();
};

export const addPaymentSource = async (sourceData: Omit<PaymentSource, 'id'>): Promise<PaymentSource> => {
  const api = await getApiService();
  return api.addPaymentSource(sourceData);
};

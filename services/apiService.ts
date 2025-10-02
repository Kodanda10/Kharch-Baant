import { Group, Transaction, PaymentSource } from '../types';
import { GROUPS, TRANSACTIONS, PAYMENT_SOURCES } from '../constants';

// --- MOCK DATABASE ---
// In a real app, this would be a database. For now, we'll use in-memory arrays.
let mockGroups: Group[] = [...GROUPS];
let mockTransactions: Transaction[] = [...TRANSACTIONS];
let mockPaymentSources: PaymentSource[] = [...PAYMENT_SOURCES];

// --- API SIMULATION ---
// This function simulates network latency.
const simulateLatency = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// --- API METHODS ---

// GROUPS
export const getGroups = async (): Promise<Group[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockGroups));
};

export const addGroup = async (groupData: Omit<Group, 'id'>): Promise<Group> => {
    await simulateLatency();
    const newGroup: Group = {
        id: `g${Date.now()}`,
        ...groupData,
    };
    mockGroups.push(newGroup);
    return JSON.parse(JSON.stringify(newGroup));
};

export const updateGroup = async (groupId: string, groupData: Omit<Group, 'id'>): Promise<Group> => {
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
};

// TRANSACTIONS
export const getTransactions = async (): Promise<Transaction[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockTransactions));
};

export const addTransaction = async (groupId: string, transactionData: Omit<Transaction, 'id' | 'groupId'>): Promise<Transaction> => {
    await simulateLatency();
    const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        groupId,
        ...transactionData,
    };
    mockTransactions.push(newTransaction);
    return JSON.parse(JSON.stringify(newTransaction));
};

export const updateTransaction = async (transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'groupId'>>): Promise<Transaction> => {
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
};

export const deleteTransaction = async (transactionId: string): Promise<{ success: boolean }> => {
    await simulateLatency();
    const initialLength = mockTransactions.length;
    mockTransactions = mockTransactions.filter(t => t.id !== transactionId);
    if (mockTransactions.length === initialLength) {
        throw new Error("Transaction not found");
    }
    return { success: true };
};


// PAYMENT SOURCES
export const getPaymentSources = async (): Promise<PaymentSource[]> => {
    await simulateLatency();
    return JSON.parse(JSON.stringify(mockPaymentSources));
};

export const addPaymentSource = async (sourceData: Omit<PaymentSource, 'id'>): Promise<PaymentSource> => {
    await simulateLatency();
    const newSource: PaymentSource = {
        id: `ps_${Date.now()}`,
        ...sourceData,
    };
    mockPaymentSources.push(newSource);
    return JSON.parse(JSON.stringify(newSource));
};

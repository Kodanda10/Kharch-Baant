import { Person, Group, Transaction, PaymentSource } from './types';

// Let's create a single user for the app.
export const CURRENT_USER_ID = 'p1';

export const PEOPLE: Person[] = [
    { id: 'p1', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=p1' },
    { id: 'p2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=p2' },
    { id: 'p3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=p3' },
    { id: 'p4', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=p4' },
    { id: 'p5', name: 'Diana', avatarUrl: 'https://i.pravatar.cc/150?u=p5' },
];

export const GROUPS: Group[] = [
    {
        id: 'g1',
        name: 'Trip to Bali',
        members: ['p1', 'p2', 'p3'],
        currency: 'INR',
    },
    {
        id: 'g2',
        name: 'Apartment Bills',
        members: ['p1', 'p4', 'p5'],
        currency: 'EUR',
    },
    {
        id: 'g3',
        name: 'Weekend Getaway',
        members: ['p1', 'p2', 'p4', 'p5'],
        currency: 'USD',
    }
];

export const PAYMENT_SOURCES: PaymentSource[] = [
    {
        id: 'ps_cash',
        name: 'Cash',
        type: 'Cash'
    }
];

export const TRANSACTIONS: Transaction[] = [
    {
        id: 't1',
        groupId: 'g1',
        description: 'Flight tickets',
        amount: 50000,
        paidById: 'p1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p2', value: 1 }, { personId: 'p3', value: 1 }] },
        date: '2024-07-10',
        tag: 'Travel',
    },
    {
        id: 't2',
        groupId: 'g1',
        description: 'Hotel booking',
        amount: 75000,
        paidById: 'p2',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p2', value: 1 }, { personId: 'p3', value: 1 }] },
        date: '2024-07-11',
        tag: 'Housing',
    },
    {
        id: 't3',
        groupId: 'g1',
        description: 'Dinner at fancy restaurant',
        amount: 12000,
        paidById: 'p3',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p2', value: 1 }, { personId: 'p3', value: 1 }] },
        date: '2024-07-12',
        tag: 'Food',
        comment: 'Celebrated the successful first day of our trip!',
    },
    {
        id: 't4',
        groupId: 'g2',
        description: 'Electricity Bill',
        amount: 75,
        paidById: 'p4',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p4', value: 1 }, { personId: 'p5', value: 1 }] },
        date: '2024-07-01',
        tag: 'Utilities',
    },
    {
        id: 't5',
        groupId: 'g2',
        description: 'Internet Bill',
        amount: 50,
        paidById: 'p1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p4', value: 1 }, { personId: 'p5', value: 1 }] },
        date: '2024-07-05',
        tag: 'Utilities',
    },
    {
        id: 't6',
        groupId: 'g3',
        description: 'Gas for the car',
        amount: 60,
        paidById: 'p2',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p2', value: 1 }, { personId: 'p4', value: 1 }] },
        date: '2024-07-15',
        tag: 'Transport',
    },
    {
        id: 't7',
        groupId: 'g3',
        description: 'Groceries for the trip',
        amount: 120,
        paidById: 'p1',
        split: { mode: 'equal', participants: [{ personId: 'p1', value: 1 }, { personId: 'p2', value: 1 }, { personId: 'p4', value: 1 }, { personId: 'p5', value: 1 }] },
        date: '2024-07-15',
        tag: 'Groceries',
    },
];
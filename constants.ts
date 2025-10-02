import { Person, Group, Transaction, PaymentSource } from './types';

// Let's create a single user for the app.
export const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001';

export const PEOPLE: Person[] = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=p1' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=p2' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=p3' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=p4' },
    { id: '00000000-0000-0000-0000-000000000005', name: 'Diana', avatarUrl: 'https://i.pravatar.cc/150?u=p5' },
];

export const GROUPS: Group[] = [
    {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Trip to Bali',
        members: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'],
        currency: 'INR',
    },
    {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Apartment Bills',
        members: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'],
        currency: 'EUR',
    },
    {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Weekend Getaway',
        members: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'],
        currency: 'USD',
    }
];

export const PAYMENT_SOURCES: PaymentSource[] = [
    {
        id: '20000000-0000-0000-0000-000000000001',
        name: 'Cash',
        type: 'Cash'
    }
];

export const TRANSACTIONS: Transaction[] = [
    {
        id: '30000000-0000-0000-0000-000000000001',
        groupId: '10000000-0000-0000-0000-000000000001',
        description: 'Flight tickets',
        amount: 50000,
        paidById: '00000000-0000-0000-0000-000000000001',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000003', value: 1 }
        ]},
        date: '2024-07-10',
        tag: 'Travel',
    },
    {
        id: '30000000-0000-0000-0000-000000000002',
        groupId: '10000000-0000-0000-0000-000000000001',
        description: 'Hotel booking',
        amount: 75000,
        paidById: '00000000-0000-0000-0000-000000000002',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000003', value: 1 }
        ]},
        date: '2024-07-11',
        tag: 'Housing',
    },
    {
        id: '30000000-0000-0000-0000-000000000003',
        groupId: '10000000-0000-0000-0000-000000000001',
        description: 'Dinner at fancy restaurant',
        amount: 12000,
        paidById: '00000000-0000-0000-0000-000000000003',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000003', value: 1 }
        ]},
        date: '2024-07-12',
        tag: 'Food',
        comment: 'Celebrated the successful first day of our trip!',
    },
    {
        id: '30000000-0000-0000-0000-000000000004',
        groupId: '10000000-0000-0000-0000-000000000002',
        description: 'Electricity Bill',
        amount: 75,
        paidById: '00000000-0000-0000-0000-000000000004',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000004', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000005', value: 1 }
        ]},
        date: '2024-07-01',
        tag: 'Utilities',
    },
    {
        id: '30000000-0000-0000-0000-000000000005',
        groupId: '10000000-0000-0000-0000-000000000002',
        description: 'Internet Bill',
        amount: 50,
        paidById: '00000000-0000-0000-0000-000000000001',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000004', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000005', value: 1 }
        ]},
        date: '2024-07-05',
        tag: 'Utilities',
    },
    {
        id: '30000000-0000-0000-0000-000000000006',
        groupId: '10000000-0000-0000-0000-000000000003',
        description: 'Gas for the car',
        amount: 60,
        paidById: '00000000-0000-0000-0000-000000000002',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000004', value: 1 }
        ]},
        date: '2024-07-15',
        tag: 'Transport',
    },
    {
        id: '30000000-0000-0000-0000-000000000007',
        groupId: '10000000-0000-0000-0000-000000000003',
        description: 'Groceries for the trip',
        amount: 120,
        paidById: '00000000-0000-0000-0000-000000000001',
        split: { mode: 'equal', participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000004', value: 1 }, 
            { personId: '00000000-0000-0000-0000-000000000005', value: 1 }
        ]},
        date: '2024-07-15',
        tag: 'Groceries',
    },
];

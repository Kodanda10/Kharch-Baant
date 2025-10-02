import { Person, Group, Transaction, PaymentSource } from './types';

// Let's create a single user for the app.
export const CURRENT_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export const PEOPLE: Person[] = [
    { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=p1' },
    { id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=p2' },
    { id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=p3' },
    { id: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=p4' },
    { id: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234', name: 'Diana', avatarUrl: 'https://i.pravatar.cc/150?u=p5' },
];

export const GROUPS: Group[] = [
    {
        id: 'f6a7b8c9-d0e1-2345-6789-0abcdef12345',
        name: 'Trip to Bali',
        members: ['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'],
        currency: 'INR',
    },
    {
        id: 'a7b8c9d0-e1f2-3456-7890-bcdef1234567',
        name: 'Apartment Bills',
        members: ['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'd4e5f6a7-b8c9-0123-4567-890abcdef123', 'e5f6a7b8-c9d0-1234-5678-90abcdef1234'],
        currency: 'EUR',
    },
    {
        id: 'b8c9d0e1-f2a3-4567-8901-cdef12345678',
        name: 'Weekend Getaway',
        members: ['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'd4e5f6a7-b8c9-0123-4567-890abcdef123', 'e5f6a7b8-c9d0-1234-5678-90abcdef1234'],
        currency: 'USD',
    }
];

export const PAYMENT_SOURCES: PaymentSource[] = [
    {
        id: 'c9d0e1f2-a3b4-5678-9012-def123456789',
        name: 'Cash',
        type: 'Cash'
    }
];

export const TRANSACTIONS: Transaction[] = [
    {
        id: 'd0e1f2a3-b4c5-6789-0123-ef1234567890',
        groupId: 'f6a7b8c9-d0e1-2345-6789-0abcdef12345',
        description: 'Flight tickets',
        amount: 50000,
        paidById: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', value: 1 }, { personId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', value: 1 }] },
        date: '2024-07-10',
        tag: 'Travel',
    },
    {
        id: 'e1f2a3b4-c5d6-7890-1234-f12345678901',
        groupId: 'f6a7b8c9-d0e1-2345-6789-0abcdef12345',
        description: 'Hotel booking',
        amount: 75000,
        paidById: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', value: 1 }, { personId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', value: 1 }] },
        date: '2024-07-11',
        tag: 'Housing',
    },
    {
        id: 'f2a3b4c5-d6e7-8901-2345-123456789012',
        groupId: 'f6a7b8c9-d0e1-2345-6789-0abcdef12345',
        description: 'Dinner at fancy restaurant',
        amount: 12000,
        paidById: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', value: 1 }, { personId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', value: 1 }] },
        date: '2024-07-12',
        tag: 'Food',
        comment: 'Celebrated the successful first day of our trip!',
    },
    {
        id: 'a3b4c5d6-e7f8-9012-3456-234567890123',
        groupId: 'a7b8c9d0-e1f2-3456-7890-bcdef1234567',
        description: 'Electricity Bill',
        amount: 75,
        paidById: 'd4e5f6a7-b8c9-0123-4567-890abcdef123',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', value: 1 }, { personId: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234', value: 1 }] },
        date: '2024-07-01',
        tag: 'Utilities',
    },
    {
        id: 'b4c5d6e7-f8a9-0123-4567-345678901234',
        groupId: 'a7b8c9d0-e1f2-3456-7890-bcdef1234567',
        description: 'Internet Bill',
        amount: 50,
        paidById: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', value: 1 }, { personId: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234', value: 1 }] },
        date: '2024-07-05',
        tag: 'Utilities',
    },
    {
        id: 'c5d6e7f8-a9b0-1234-5678-456789012345',
        groupId: 'b8c9d0e1-f2a3-4567-8901-cdef12345678',
        description: 'Gas for the car',
        amount: 60,
        paidById: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', value: 1 }, { personId: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', value: 1 }] },
        date: '2024-07-15',
        tag: 'Transport',
    },
    {
        id: 'd6e7f8a9-b0c1-2345-6789-567890123456',
        groupId: 'b8c9d0e1-f2a3-4567-8901-cdef12345678',
        description: 'Groceries for the trip',
        amount: 120,
        paidById: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        split: { mode: 'equal', participants: [{ personId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', value: 1 }, { personId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', value: 1 }, { personId: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', value: 1 }, { personId: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234', value: 1 }] },
        date: '2024-07-15',
        tag: 'Groceries',
    },
];

import { Transaction } from '../types';

/**
 * Calculates the amount each person owes for a given transaction based on its split mode.
 * @param transaction The transaction object.
 * @returns A Map where keys are person IDs and values are the amounts they owe.
 */
export const calculateShares = (transaction: Transaction): Map<string, number> => {
    const shares = new Map<string, number>();
    const { amount, split } = transaction;
    const { mode, participants } = split;

    if (participants.length === 0 || amount === 0) {
        return shares;
    }

    switch (mode) {
        case 'equal': {
            const shareAmount = amount / participants.length;
            participants.forEach(p => {
                shares.set(p.personId, shareAmount);
            });
            break;
        }
        case 'unequal': {
            participants.forEach(p => {
                shares.set(p.personId, p.value);
            });
            break;
        }
        case 'percentage': {
            participants.forEach(p => {
                const shareAmount = amount * (p.value / 100);
                shares.set(p.personId, shareAmount);
            });
            break;
        }
        case 'shares': {
            const totalShares = participants.reduce((sum, p) => sum + p.value, 0);
            if (totalShares === 0) break;
            const valuePerShare = amount / totalShares;
            participants.forEach(p => {
                shares.set(p.personId, p.value * valuePerShare);
            });
            break;
        }
    }
    return shares;
};

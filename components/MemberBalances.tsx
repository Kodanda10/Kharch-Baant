import React from 'react';
import { Transaction, Person, Currency } from '../types';
import Avatar from './Avatar';
import { calculateShares } from '../utils/calculations';

interface MemberBalancesProps {
    transactions: Transaction[];
    people: Person[];
    currency: Currency;
    currentUserId: string;
}

const MemberBalances: React.FC<MemberBalancesProps> = ({ transactions, people, currency, currentUserId }) => {
    const balances = new Map<string, number>();
    people.forEach(p => balances.set(p.id, 0));

    transactions.forEach(t => {
        // Add the full amount to the payer's balance
        balances.set(t.paidById, (balances.get(t.paidById) || 0) + t.amount);

        // Subtract each person's share from their balance
        const shares = calculateShares(t);
        shares.forEach((shareAmount, personId) => {
            balances.set(personId, (balances.get(personId) || 0) - shareAmount);
        });
    });

    // FIX: Explicitly type the Map to aid TypeScript's type inference.
    const peopleMap = new Map<string, Person>(people.map(p => [p.id, p]));
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
    };

    return (
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Member Balances</h3>
            <ul className="space-y-3">
                {Array.from(balances.entries())
                    .sort(([, a], [, b]) => b - a)
                    .map(([personId, balance]) => {
                        const person = peopleMap.get(personId);
                        if (!person) return null;
                        
                        const isCurrentUser = personId === currentUserId;
                        return (
                            <li key={personId} className="flex justify-between items-center text-sm">
                               <div className="flex items-center gap-3">
                                   <Avatar person={person} size="md" />
                                   <span className={`font-medium ${isCurrentUser ? 'text-indigo-400' : 'text-slate-300'}`}>{person.name}</span>
                               </div>
                                <span className={`font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(balance)}
                                </span>
                            </li>
                        );
                })}
            </ul>
        </div>
    );
};

export default MemberBalances;
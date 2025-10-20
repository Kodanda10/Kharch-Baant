import React, { useMemo } from 'react';
import { Transaction, Person, Currency } from '../types';
import { calculateShares } from '../utils/calculations';

interface DashboardProps {
    transactions: Transaction[];
    currentUserId: string;
    people: Person[];
    currency: Currency;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currentUserId, people, currency }) => {
    const { totalOwedToUser, totalUserOwes, netBalance } = useMemo(() => {
        let owedToUser = 0;
        let userOwes = 0;

        if (!currentUserId) {
            console.warn('Dashboard: No current user ID provided');
            return {
                totalOwedToUser: 0,
                totalUserOwes: 0,
                netBalance: 0,
            };
        }

        transactions.forEach(t => {
            const shares = calculateShares(t);
            const userShare = shares.get(currentUserId) || 0;

            if (t.paidById === currentUserId) {
                // User paid, so they are owed what others were supposed to pay
                owedToUser += (t.amount - userShare);
            } else {
                // Someone else paid, and the user has a share
                userOwes += userShare;
            }
        });
        
        const net = owedToUser - userOwes;


        return {
            totalOwedToUser: owedToUser,
            totalUserOwes: userOwes,
            netBalance: net,
        };
    }, [transactions, currentUserId]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-white/10 min-w-0">
                <h3 className="text-sm font-medium text-slate-400">You are owed</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-400 mt-2 break-words truncate" title={formatCurrency(totalOwedToUser)}>
                    {formatCurrency(totalOwedToUser)}
                </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-white/10 min-w-0">
                <h3 className="text-sm font-medium text-slate-400">You owe</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-rose-400 mt-2 break-words truncate" title={formatCurrency(totalUserOwes)}>
                    {formatCurrency(totalUserOwes)}
                </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-white/10 min-w-0">
                <h3 className="text-sm font-medium text-slate-400">Total Balance</h3>
                <p className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-2 break-words truncate ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={formatCurrency(netBalance)}>
                    {formatCurrency(netBalance)}
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
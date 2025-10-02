import React, { useMemo } from 'react';
import { Group, Transaction, Person } from '../types';
import Avatar from './Avatar';
import { calculateShares } from '../utils/calculations';

interface GroupSummaryCardProps {
    group: Group;
    transactions: Transaction[];
    people: Person[];
    currentUserId: string;
    onSelectGroup: (groupId: string) => void;
}

const GroupSummaryCard: React.FC<GroupSummaryCardProps> = ({ group, transactions, people, currentUserId, onSelectGroup }) => {
    
    const { userBalance } = useMemo(() => {
        let balance = 0;
        transactions.forEach(t => {
            const shares = calculateShares(t);
            const userShare = shares.get(currentUserId) || 0;
            
            if (t.paidById === currentUserId) {
                balance += (t.amount - userShare);
            } else {
                balance -= userShare;
            }
        });
        return { userBalance: balance };
    }, [transactions, currentUserId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: group.currency, signDisplay: 'auto' }).format(amount);
    };
    
    const members = people.filter(p => group.members.includes(p.id));

    let balanceText = "You are settled up";
    let balanceColor = "text-slate-400";

    if (userBalance > 0.01) {
        balanceText = `You are owed ${formatCurrency(userBalance)}`;
        balanceColor = "text-emerald-400";
    } else if (userBalance < -0.01) {
        balanceText = `You owe ${formatCurrency(Math.abs(userBalance))}`;
        balanceColor = "text-rose-400";
    }

    return (
        <button 
            onClick={() => onSelectGroup(group.id)}
            className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg text-left w-full h-full flex flex-col justify-between hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            <div>
                <h3 className="text-lg font-bold text-white truncate">{group.name}</h3>
                <div className="flex items-center mt-3 -space-x-2">
                    {members.slice(0, 5).map(member => (
                       <Avatar key={member.id} person={member} size="md" />
                    ))}
                    {members.length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-800">
                            +{members.length - 5}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
                <p className={`font-semibold ${balanceColor}`}>{balanceText}</p>
            </div>
        </button>
    );
};

export default GroupSummaryCard;
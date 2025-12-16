import React from 'react';
import { Transaction, Person, Currency } from '../types';
import { EditIcon, DeleteIcon } from './icons/Icons';

// Simple eye icon for view details
const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3  3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
import { calculateShares } from '../utils/calculations';

interface TransactionItemProps {
    transaction: Transaction;
    peopleMap: Map<string, Person>;
    currentUserId: string;
    currency: Currency;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    onViewDetails?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, peopleMap, currentUserId, currency, onEdit, onDelete, onViewDetails }) => {
    const paidBy = peopleMap.get(transaction.paidById);

    let userImpactAmount = 0;
    let userImpactText = '';

    const shares = calculateShares(transaction);
    const userOwedShare = shares.get(currentUserId) || 0;

    if (transaction.paidById === currentUserId) {
        const totalOwedByOthers = transaction.amount - userOwedShare;
        if (Math.abs(totalOwedByOthers) > 0.001) {
            userImpactAmount = totalOwedByOthers;
            userImpactText = 'You are owed';
        }
    } else if (userOwedShare > 0) {
        userImpactAmount = -userOwedShare;
        userImpactText = 'You owe';
    }


    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
    };

    return (
        <div className="flex items-start p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors min-w-0">
            <div className="w-12 text-center mr-4 flex-shrink-0 pt-1">
                <div className="text-xs text-slate-400">{formatDate(transaction.date).split(' ')[0]}</div>
                <div className="text-lg font-bold text-white">{formatDate(transaction.date).split(' ')[1]}</div>
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-white truncate flex items-center gap-2">
                    {transaction.description}
                    {transaction.type === 'settlement' && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">Settlement</span>
                    )}
                </p>
                <p className="text-sm text-slate-400 truncate">
                    {transaction.payers && transaction.payers.length > 1
                        ? `${transaction.payers.length} people paid ${formatCurrency(transaction.amount)}`
                        : `${paidBy?.name} paid ${formatCurrency(transaction.amount)}`
                    }
                </p>
                {transaction.comment && (
                    <p className="text-sm text-slate-400 italic mt-1 pt-1 border-t border-white/10 truncate">
                        {transaction.comment}
                    </p>
                )}
            </div>
            <div className="text-right mx-2 md:mx-4 w-20 md:w-32 hidden md:block pt-1 flex-shrink-0">
                {userImpactAmount !== 0 && (
                    <>
                        <p className="text-xs text-slate-400 truncate">{userImpactText}</p>
                        <p className={`font-bold truncate ${userImpactAmount > 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={formatCurrency(Math.abs(userImpactAmount))}>
                            {formatCurrency(Math.abs(userImpactAmount))}
                        </p>
                    </>
                )}
            </div>
            <div className="flex items-center space-x-1 pt-1 flex-shrink-0">
                {onViewDetails && (
                    <button
                        onClick={() => onViewDetails(transaction)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-full transition-colors"
                        title="View Details"
                    >
                        <EyeIcon />
                    </button>
                )}
                <button
                    onClick={() => onEdit(transaction)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Edit"
                >
                    <EditIcon />
                </button>
                <button
                    onClick={() => onDelete(transaction.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/10 rounded-full transition-colors"
                    title="Delete"
                >
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );
};

export default TransactionItem;
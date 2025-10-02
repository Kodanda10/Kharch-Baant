import React from 'react';
import { Transaction, Person, Currency } from '../types';
import { EditIcon, DeleteIcon } from './icons/Icons';
import { calculateShares } from '../utils/calculations';

interface TransactionItemProps {
    transaction: Transaction;
    peopleMap: Map<string, Person>;
    currentUserId: string;
    currency: Currency;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, peopleMap, currentUserId, currency, onEdit, onDelete }) => {
    const paidBy = peopleMap.get(transaction.paidById);
    
    let userImpactAmount = 0;
    let userImpactText = '';
    
    const shares = calculateShares(transaction);
    const userOwedShare = shares.get(currentUserId) || 0;

    if (transaction.paidById === currentUserId) {
        const totalOwedByOthers = transaction.amount - userOwedShare;
        if(Math.abs(totalOwedByOthers) > 0.001) {
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
        <div className="flex items-start p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div className="w-12 text-center mr-4 flex-shrink-0 pt-1">
                <div className="text-xs text-slate-400">{formatDate(transaction.date).split(' ')[0]}</div>
                <div className="text-lg font-bold text-white">{formatDate(transaction.date).split(' ')[1]}</div>
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-white">{transaction.description}</p>
                <p className="text-sm text-slate-400">
                    {paidBy?.name} paid {formatCurrency(transaction.amount)}
                </p>
                {transaction.comment && (
                     <p className="text-sm text-slate-400 italic mt-1 pt-1 border-t border-white/10">
                        {transaction.comment}
                    </p>
                )}
            </div>
            <div className="text-right mx-4 w-32 hidden md:block pt-1">
                {userImpactAmount !== 0 && (
                    <>
                        <p className="text-xs text-slate-400">{userImpactText}</p>
                        <p className={`font-bold ${userImpactAmount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(Math.abs(userImpactAmount))}
                        </p>
                    </>
                )}
            </div>
            <div className="flex items-center space-x-2 pt-1">
                 <button onClick={() => onEdit(transaction)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <EditIcon />
                </button>
                <button onClick={() => onDelete(transaction.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/10 rounded-full transition-colors">
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );
};

export default TransactionItem;
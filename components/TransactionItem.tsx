import React from 'react';
import { Transaction, Person, Currency } from '../types';
import { EditIcon, DeleteIcon } from './icons/Icons';

// Simple eye icon for view details
const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

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
    const isSettlement = transaction.type === 'settlement';

    const formatDate = (dateString: string) => {
        const d = new Date(dateString + 'T00:00:00');
        return {
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            day: d.getDate()
        };
    };

    const { month, day } = formatDate(transaction.date);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
    };

    // Clean up description for display
    let displayDescription = transaction.description;
    if (isSettlement && displayDescription.startsWith('Settlement: ')) {
        displayDescription = displayDescription.replace('Settlement: ', '');
    }

    // Settlement Flow Data
    const receiverId = isSettlement
        ? transaction.split?.participants?.find(p => p.personId !== transaction.paidById)?.personId
        : null;
    const receiver = receiverId ? peopleMap.get(receiverId) : null;

    return (
        <div className="group relative bg-slate-800/40 hover:bg-slate-800/80 rounded-xl border border-white/5 p-2.5 transition-all duration-200">
            <div className="flex items-center gap-3">

                {/* 1. Date Column */}
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-700/50 rounded-lg border border-white/5 flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">{month}</span>
                    <span className="text-lg font-bold text-white leading-none">{day}</span>
                </div>

                {/* 2. Main Content */}
                <div className="flex-grow min-w-0 space-y-0.5">
                    {/* Header: Desc OR Settlement Flow */}
                    <div className="flex items-center gap-2">
                        {isSettlement && receiver ? (
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] capitalize whitespace-nowrap">
                                    {paidBy?.name}
                                </span>
                                <span className="text-emerald-500 font-bold">→</span>
                                <span className="text-slate-200 capitalize whitespace-nowrap">
                                    {receiver.name}
                                </span>
                            </div>
                        ) : (
                            <h3 className="text-sm font-semibold text-white truncate capitalize">
                                {displayDescription}
                            </h3>
                        )}

                        {/* Badge - Removed as per user preference (redundant with neon flow) */}
                    </div>

                    {/* Paid By Details (Hide for settlement as it is shown in title now) */}
                    {!isSettlement && (
                        <div className="text-xs text-slate-400 leading-snug truncate">
                            {transaction.payers && transaction.payers.length > 0 ? (
                                <span className="flex flex-wrap gap-1">
                                    {transaction.payers.map((p, i) => (
                                        <span key={p.personId}>
                                            {i > 0 && ', '}
                                            <span className="text-slate-300 font-medium capitalize">{peopleMap.get(p.personId)?.name}</span> paid {formatCurrency(p.amount)}
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                <span>
                                    Paid by <span className="text-slate-300 font-medium capitalize">{paidBy?.name}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Comment */}
                    {transaction.comment && (
                        <p className="text-[10px] text-slate-500 italic truncate max-w-[90%] before:content-['❝'] before:mr-0.5">
                            {transaction.comment}
                        </p>
                    )}
                </div>

                {/* 3. Amount & Actions Column */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 pl-2">
                    <span className={`text-base font-bold whitespace-nowrap ${isSettlement ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-slate-200'}`}>
                        {formatCurrency(transaction.amount)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {onViewDetails && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewDetails(transaction); }}
                                className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                            >
                                <EyeIcon />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                            <EditIcon width="16" height="16" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                        >
                            <DeleteIcon width="16" height="16" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TransactionItem;
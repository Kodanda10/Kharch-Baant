

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Person, TAGS, Tag, PaymentSource, SplitMode, Split, SplitParticipant } from '../types';
import { validateSplit } from '../utils/calculations';
import { suggestTagForDescription } from '../services/geminiService';
import CalendarModal from './CalendarModal';
import Avatar from './Avatar';
import { CalendarIcon } from './icons/Icons';

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id' | 'groupId'>) => void;
    transaction: Transaction | null;
    people: Person[];
    currentUserId: string;
    paymentSources: PaymentSource[];
    onAddNewPaymentSource: () => void;
}

const splitModes: { id: SplitMode, label: string }[] = [
    { id: 'equal', label: 'Equally' },
    { id: 'unequal', label: 'Unequally' },
    { id: 'percentage', label: 'By Percentage' },
    { id: 'shares', label: 'By Shares' },
];

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, transaction, people, currentUserId, paymentSources, onAddNewPaymentSource }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [paidById, setPaidById] = useState(currentUserId);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tag, setTag] = useState<Tag>(TAGS[0]);
    const [paymentSourceId, setPaymentSourceId] = useState<string | undefined>(undefined);
    const [comment, setComment] = useState('');
    const [isSuggestingTag, setIsSuggestingTag] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // Advanced Split State
    const [splitMode, setSplitMode] = useState<SplitMode>('equal');
    const [splitParticipants, setSplitParticipants] = useState<string[]>([]);
    const [customSplitValues, setCustomSplitValues] = useState<Map<string, number>>(new Map());

    const resetForm = useCallback(() => {
        setDescription('');
        setAmount('');
        setPaidById(currentUserId);
        setDate(new Date().toISOString().split('T')[0]);
        setTag(TAGS[0]);
        const defaultCash = paymentSources.find(p => p.type === 'Cash' && p.isActive !== false);
        setPaymentSourceId(defaultCash?.id);
        setComment('');
        setSplitMode('equal');
        setSplitParticipants(people.map(p => p.id));
        setCustomSplitValues(new Map());
    }, [currentUserId, people, paymentSources]);
    
    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                // Edit mode - populate with transaction data
                setDescription(transaction.description);
                setAmount(transaction.amount);
                setPaidById(transaction.paidById);
                setDate(transaction.date);
                setTag(transaction.tag);
                setPaymentSourceId(transaction.paymentSourceId);
                setComment(transaction.comment || '');
                setSplitMode(transaction.split.mode);
                const participants = transaction.split.participants.map(p => p.personId);
                setSplitParticipants(participants);
                const values = new Map(transaction.split.participants.map(p => [p.personId, p.value]));
                setCustomSplitValues(values);
            } else {
                // Create mode - only reset on first open, not when paymentSources change
                resetForm();
            }
        }
    }, [transaction, isOpen]); // Removed resetForm dependency to prevent form reset when payment sources change
    
    // Update default payment source when paymentSources change, but preserve other form data
    useEffect(() => {
        if (isOpen && !transaction && !paymentSourceId) {
            const cashSource = paymentSources.find(p => p.type === 'Cash' && p.isActive !== false);
            if (cashSource) {
                setPaymentSourceId(cashSource.id);
            }
        }
    }, [paymentSources, isOpen, transaction, paymentSourceId]);

    const handleParticipantChange = (personId: string) => {
        setSplitParticipants(prev => {
            const newParticipants = prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId];
            // Reset custom values if participants change in a custom split mode
            if (splitMode !== 'equal') {
                // FIX: Explicitly type the new Map to match the state's type.
                setCustomSplitValues(new Map<string, number>());
            }
            return newParticipants;
        });
    };

    const handleCustomSplitChange = (personId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setCustomSplitValues(prev => new Map(prev).set(personId, numValue));
    };

    const { splitTotal, isSplitValid, validationReason } = useMemo(() => {
        if (splitMode === 'equal' || !amount) {
            return { splitTotal: amount || 0, isSplitValid: splitParticipants.length > 0, validationReason: splitParticipants.length>0? undefined : 'Select at least one participant' };
        }
        
        const total = Array.from(customSplitValues.entries())
            .filter(([personId]) => splitParticipants.includes(personId))
            .reduce((sum, [, value]) => sum + value, 0);

        if (splitMode === 'unequal') {
            const numericTotal = Number(total);
            const ok = Math.abs(numericTotal - Number(amount)) < 0.01;
            return { splitTotal: total, isSplitValid: ok, validationReason: ok? undefined : 'Unequal split must sum to amount' };
        }
        if (splitMode === 'percentage') {
            const numericTotal = Number(total);
            const ok = Math.abs(numericTotal - 100) < 0.01;
            return { splitTotal: total, isSplitValid: ok, validationReason: ok? undefined : 'Percentages must total 100%' };
        }
        if (splitMode === 'shares') {
            const numericTotal = Number(total);
            const ok = numericTotal > 0;
            return { splitTotal: total, isSplitValid: ok, validationReason: ok? undefined : 'Total shares must be > 0' };
        }
        return { splitTotal: 0, isSplitValid: false, validationReason: 'Invalid split' };
    }, [splitMode, customSplitValues, amount, splitParticipants]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Coerce `amount` to a number for comparison.
        if (!isSplitValid || !description || !(Number(amount) > 0) || !paidById || splitParticipants.length === 0) {
            alert(validationReason || 'Please check all fields and ensure the split is correct.');
            return;
        }

        const baseParticipants = splitParticipants.map(personId => ({
            personId,
            value: customSplitValues.get(personId) || 0,
        }));

        let participants: SplitParticipant[];

        if (splitMode === 'equal') {
            participants = splitParticipants.map(personId => ({ personId, value: 1 }));
        } else if (splitMode === 'shares') {
            participants = baseParticipants.map(p => ({...p, value: p.value || 1}));
        } 
        else {
            participants = baseParticipants;
        }

        const split: Split = { mode: splitMode, participants };

        onSave({
            description,
            amount: Number(amount),
            paidById,
            date,
            tag,
            paymentSourceId,
            split,
            comment,
            type: transaction?.type ?? 'expense',
        });
    };

    const handleDescriptionBlur = useCallback(async () => {
        if (description.trim().length > 5 && !transaction) { // Only suggest for new transactions
            setIsSuggestingTag(true);
            const suggestedTag = await suggestTagForDescription(description);
            if (suggestedTag) setTag(suggestedTag as Tag);
            setIsSuggestingTag(false);
        }
    }, [description, transaction]);
    
    const renderSplitInputs = () => {
        if (splitMode === 'equal') return null;

        const symbol = splitMode === 'percentage' ? '%' : splitMode === 'shares' ? 'x' : '';
        const inputType = splitMode === 'unequal' ? 'number' : 'text';

        return (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {splitParticipants.map(personId => {
                    const person = people.find(p => p.id === personId);
                    if (!person) return null;
                    return (
                        <div key={personId} className="flex items-center gap-2">
                           <Avatar person={person} size="sm" />
                           <label htmlFor={`split-${personId}`} className="flex-1 text-sm text-slate-300">{person.name}</label>
                           <div className="relative w-24">
                                <input
                                    type={inputType}
                                    id={`split-${personId}`}
                                    value={customSplitValues.get(personId) || ''}
                                    onChange={e => handleCustomSplitChange(personId, e.target.value)}
                                    className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 text-right pr-6"
                                    placeholder={splitMode === 'shares' ? "1" : "0"}
                                    {...(inputType === 'number' && {step: "0.01"})}
                                />
                                {symbol && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">{symbol}</span>}
                           </div>
                        </div>
                    )
                })}
            </div>
        )
    };

    const renderSplitFooter = () => {
        let text = '';
        let color = 'text-emerald-400';
        if (!amount) return null;

        if (splitMode === 'unequal') {
            // FIX: Coerce `amount` to a number for arithmetic operation.
            const remaining = Number(amount) - splitTotal;
            text = `${remaining.toFixed(2)} left`;
            if (Math.abs(remaining) > 0.01) color = 'text-rose-400';
        }
        if (splitMode === 'percentage') {
            text = `${splitTotal.toFixed(0)}% of 100%`;
             if (Math.abs(splitTotal - 100) > 0.01) color = 'text-rose-400';
        }
        if (splitMode === 'shares') {
            const currentTotal = splitParticipants.reduce((sum, pId) => sum + (customSplitValues.get(pId) || 1), 0);
            text = `${currentTotal} total shares`;
        }
        if (splitMode === 'equal' || !text) return null;

        return (
            <div className={`text-right text-sm font-semibold mt-2 px-2 ${color}`}>
                {text}
            </div>
        )
    }

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                    <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">{transaction ? 'Edit Expense' : 'Add Expense'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} onBlur={handleDescriptionBlur} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600" required min="0.01" step="0.01" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="date-button" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                                <button type="button" id="date-button" onClick={() => setIsCalendarOpen(true)} className="w-full text-left bg-black/30 text-white rounded-md p-2 pr-10 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-1">Comment (Optional)</label>
                            <textarea
                                id="comment"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={2}
                                placeholder="Add any notes or details here..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="tag" className="block text-sm font-medium text-slate-300 mb-1">
                                    Category {isSuggestingTag && <span className="text-xs text-indigo-400 ml-2">Suggesting...</span>}
                                </label>
                                <select 
                                    id="tag" 
                                    value={tag} 
                                    onChange={e => setTag(e.target.value as Tag)} 
                                    className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                             <div className="flex-1">
                                <label htmlFor="paymentSourceId" className="block text-sm font-medium text-slate-300 mb-1">Payment Source</label>
                                <select 
                                    id="paymentSourceId" 
                                    value={paymentSourceId || ''} 
                                    onChange={e => {
                                        if (e.target.value === 'add_new') {
                                            onAddNewPaymentSource();
                                        } else {
                                            setPaymentSourceId(e.target.value || undefined);
                                        }
                                    }} 
                                    className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">None</option>
                                    {paymentSources.map(ps => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
                                    <option value="add_new" className="text-indigo-400 font-semibold">
                                        + Add a new source...
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Paid by</label>
                            <select value={paidById} onChange={e => setPaidById(e.target.value)} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500">
                                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* SPLIT SECTION */}
                        <div className="bg-black/20 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Split</label>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {splitModes.map(mode => (
                                    <button key={mode.id} type="button" onClick={() => setSplitMode(mode.id)} className={`px-3 py-1 text-sm rounded-full transition-colors ${splitMode === mode.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                {people.map(p => (
                                    <label key={p.id} className="flex items-center space-x-2 bg-black/20 p-2 rounded-md cursor-pointer hover:bg-black/40">
                                        <input type="checkbox" checked={splitParticipants.includes(p.id)} onChange={() => handleParticipantChange(p.id)} className="h-4 w-4 rounded text-indigo-600 bg-slate-600 border-slate-500 focus:ring-indigo-500" />
                                        <span className="text-sm">{p.name}</span>
                                    </label>
                                ))}
                            </div>
                            {renderSplitInputs()}
                            {renderSplitFooter()}
                            {!isSplitValid && amount && (
                                <div className="mt-2 text-xs font-medium text-rose-400">
                                    {validationReason}
                                </div>
                            )}
                        </div>
                        
                    </form>
                    <div className="flex justify-end gap-4 pt-4 mt-auto flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Cancel</button>
                        <button type="button" onClick={handleSubmit} disabled={!isSplitValid} className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                    </div>
                </div>
            </div>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={date} onDateSelect={(d) => {setDate(d); setIsCalendarOpen(false);}} />
        </>
    );
};

export default TransactionFormModal;
import React, { useState } from 'react';
import { PaymentSource, PaymentSourceType, CreditCardDetails, UPIDetails } from '../types';

interface PaymentSourceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (source: Omit<PaymentSource, 'id'>) => void;
}

const PaymentSourceFormModal: React.FC<PaymentSourceFormModalProps> = ({ isOpen, onClose, onSave }) => {
    const [type, setType] = useState<PaymentSourceType>('Credit Card');
    const [name, setName] = useState('');
    const [issuer, setIssuer] = useState('');
    const [last4, setLast4] = useState('');
    const [appName, setAppName] = useState('');
    const [upiId, setUpiId] = useState('');
    
    const resetForm = () => {
        setType('Credit Card');
        setName('');
        setIssuer('');
        setLast4('');
        setAppName('');
        setUpiId('');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        let details: CreditCardDetails | UPIDetails | undefined;
        if (type === 'Credit Card') {
            if (!name || !issuer || !last4) return;
            details = { issuer, last4 };
        } else if (type === 'UPI') {
            if (!name || !appName || !upiId) return;
            details = { appName, upiId };
        } else {
            if (!name) return;
        }

        onSave({ name, type, details });
        resetForm();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-source-modal-title">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
                <h2 id="payment-source-modal-title" className="text-2xl font-bold text-white mb-6">Add New Payment Source</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="source-name" className="block text-sm font-medium text-slate-300 mb-1">Source Name</label>
                        <input
                            type="text"
                            id="source-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., My HDFC Visa, Mom's GPay"
                            className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="source-type" className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                        <select
                            id="source-type"
                            value={type}
                            onChange={e => setType(e.target.value as PaymentSourceType)}
                            className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Credit Card">Credit Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {type === 'Credit Card' && (
                        <>
                            <div>
                                <label htmlFor="issuer" className="block text-sm font-medium text-slate-300 mb-1">Card Issuer</label>
                                <input type="text" id="issuer" value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="e.g., Visa, Mastercard" className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="last4" className="block text-sm font-medium text-slate-300 mb-1">Last 4 Digits</label>
                                <input type="text" id="last4" value={last4} onChange={e => setLast4(e.target.value)} maxLength={4} pattern="\d{4}" placeholder="1234" className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                        </>
                    )}

                    {type === 'UPI' && (
                        <>
                            <div>
                                <label htmlFor="appName" className="block text-sm font-medium text-slate-300 mb-1">UPI App</label>
                                <input type="text" id="appName" value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g., Google Pay, PhonePe" className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="upiId" className="block text-sm font-medium text-slate-300 mb-1">UPI ID</label>
                                <input type="text" id="upiId" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g., yourname@okbank" className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700">Add Source</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentSourceFormModal;

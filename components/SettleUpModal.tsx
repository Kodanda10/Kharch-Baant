import React, { useState, useEffect, useMemo } from 'react';
import BaseModal from './BaseModal';
import { Person, Transaction, PaymentSource } from '../types';
import { addTransaction } from '../services/apiService';
import { calculateShares } from '../utils/calculations';

interface SettleUpModalProps {
  open: boolean;
  onClose(): void;
  groupId: string;
  members: Person[];
  paymentSources: PaymentSource[];
  transactions: Transaction[]; // existing group transactions for balance preview
  currency?: string; // optional currency code for formatting
  onCreated(tx: Transaction): void;
  defaultPayerId?: string; // person initiating payment (payer gives money)
  defaultReceiverId?: string; // person receiving money
  defaultAmount?: number;
}

/**
 * Records a settlement transaction between two members.
 * Represented as a transaction with type='settlement'.
 * We model it as paidBy = payer, amount = settlementAmount, split with participants [payer, receiver] and unequal values so that receiver owes full amount (so payer's balance decreases, receiver's balance increases appropriately after share subtraction).
 */
const SettleUpModal: React.FC<SettleUpModalProps> = ({ open, onClose, groupId, members, paymentSources, transactions, currency='USD', onCreated, defaultPayerId, defaultReceiverId, defaultAmount }) => {
  const [payerId, setPayerId] = useState<string>(defaultPayerId || '');
  const [receiverId, setReceiverId] = useState<string>(defaultReceiverId || '');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentSourceId, setPaymentSourceId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPayerId(defaultPayerId || '');
      setReceiverId(defaultReceiverId || '');
  setAmount(defaultAmount ? String(defaultAmount.toFixed(2)) : '');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      const cash = paymentSources.find(p => p.type === 'Cash' && p.isActive !== false);
      setPaymentSourceId(cash?.id);
    }
  }, [open, defaultPayerId, defaultReceiverId, defaultAmount, paymentSources]);

  const amountNumber = parseFloat(amount) || 0;
  const isValid = payerId && receiverId && payerId !== receiverId && amountNumber > 0 && !submitting;

  // Compute current balances for the two selected members only (reuse simplified logic of MemberBalances)
  const { currentPayerBalance, currentReceiverBalance } = useMemo(() => {
    if (!payerId || !receiverId) return { currentPayerBalance: 0, currentReceiverBalance: 0 };
    const setIds = new Set([payerId, receiverId]);
    const bal = new Map<string, number>(Array.from(setIds).map(id => [id, 0]));
    transactions.forEach(t => {
      if (!setIds.has(t.paidById) && !t.split.participants.some(p => setIds.has(p.personId))) return;
      // Add full amount to payer
      if (setIds.has(t.paidById)) {
        bal.set(t.paidById, (bal.get(t.paidById) || 0) + t.amount);
      }
      const shares = calculateShares(t);
      shares.forEach((shareAmount, pid) => {
        if (setIds.has(pid)) {
          bal.set(pid, (bal.get(pid) || 0) - shareAmount);
        }
      });
    });
    return { currentPayerBalance: bal.get(payerId) || 0, currentReceiverBalance: bal.get(receiverId) || 0 };
  }, [transactions, payerId, receiverId]);

  // Projected balances after settlement (payer gives money to receiver): payer balance decreases, receiver increases
  const projected = useMemo(() => {
    return {
      payerAfter: currentPayerBalance - amountNumber,
      receiverAfter: currentReceiverBalance + amountNumber,
    };
  }, [currentPayerBalance, currentReceiverBalance, amountNumber]);

  const format = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      // Build settlement transaction shape (Correct modeling: receiver is payer of synthetic expense; payer owes full share so payer's balance goes down)
      const txBase: Omit<Transaction, 'id' | 'groupId'> = {
        description: `Settlement: ${members.find(m => m.id === payerId)?.name} → ${members.find(m => m.id === receiverId)?.name}`,
        amount: amountNumber,
        paidById: receiverId,
        date,
        tag: 'Other',
        paymentSourceId: paymentSourceId || undefined,
        comment: note || undefined,
        split: {
          mode: 'unequal',
          participants: [
            { personId: payerId, value: amountNumber }, // payer owes full amount (reduces their positive balance)
            { personId: receiverId, value: 0 }, // receiver owes nothing (increases their balance)
          ],
        },
        type: 'settlement',
      };
      const created = await addTransaction(groupId, txBase);
      onCreated(created);
      onClose();
    } catch (e) {
      console.error('Failed to create settlement', e);
      alert('Failed to record settlement');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 disabled:opacity-50">Cancel</button>
      <button type="button" onClick={handleSubmit} disabled={!isValid} className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-md hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? 'Recording…' : 'Record Settlement'}
      </button>
    </>
  );

  const payer = members.find(m => m.id === payerId);
  const receiver = members.find(m => m.id === receiverId);

  return (
    <BaseModal
      open={open}
      onClose={() => !submitting && onClose()}
      title="Settle Up"
      size="md"
      description={<span className="text-slate-300 text-sm">Record a payment transfer between two members. This does not create a new expense but adjusts balances.</span>}
      footer={footer}
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-payer">Payer (who paid now)</label>
            <select id="settle-payer" aria-label="Payer" value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="">Select member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-receiver">Receiver</label>
            <select id="settle-receiver" aria-label="Receiver" value={receiverId} onChange={e => setReceiverId(e.target.value)} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="">Select member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        {payerId && receiverId && payerId === receiverId && (
          <p className="text-xs text-rose-400">Payer and receiver cannot be the same.</p>
        )}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-amount">Amount</label>
            <input id="settle-amount" aria-label="Amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" placeholder="0.00" />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-date">Date</label>
            <input id="settle-date" aria-label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
        </div>
        <div>
          <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-ps">Payment Source (optional)</label>
          <select id="settle-ps" aria-label="Payment Source" value={paymentSourceId || ''} onChange={e => setPaymentSourceId(e.target.value || undefined)} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">None</option>
            {paymentSources.filter(ps => ps.isActive !== false).map(ps => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-slate-300 text-xs uppercase tracking-wide" htmlFor="settle-note">Note (optional)</label>
            <textarea id="settle-note" aria-label="Note" value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Optional context..." />
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-xs text-emerald-300 space-y-2">
          <p><span className="font-semibold">How it works:</span> {payer?.name || 'Payer'} gives money to {receiver?.name || 'Receiver'}; this reduces {payer?.name || 'payer'}'s positive balance and increases {receiver?.name || 'receiver'}'s balance.</p>
          {payerId && receiverId && amountNumber > 0 && (
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-1">
                <p className="text-slate-400 uppercase tracking-wide">{payer?.name || 'Payer'}</p>
                <p className="font-mono">
                  {format(currentPayerBalance)} → <span className={`${projected.payerAfter >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{format(projected.payerAfter)}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 uppercase tracking-wide">{receiver?.name || 'Receiver'}</p>
                <p className="font-mono">
                  {format(currentReceiverBalance)} → <span className={`${projected.receiverAfter >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{format(projected.receiverAfter)}</span>
                </p>
              </div>
            </div>
          )}
          {payerId && receiverId && amountNumber > 0 && (
            <p className="text-slate-400">Net shift: {payer?.name} {format(amountNumber)} → {receiver?.name}</p>
          )}
          {payerId && amountNumber > 0 && amountNumber > currentPayerBalance && (
            <p className="text-amber-400 mt-1 flex items-start gap-1"><span className="font-semibold">Warning:</span> Settlement amount exceeds {payer?.name || 'payer'}'s current positive balance ({format(currentPayerBalance)}). This is allowed but will make their balance negative.</p>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default SettleUpModal;

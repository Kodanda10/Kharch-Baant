import React, { useState } from 'react';
import * as api from '../services/apiService';
import { Group, Transaction } from '../types';

interface DebugPanelProps {
  groups: Group[];
  transactions: Transaction[];
}

// Lightweight developer-only debug drawer to inspect current in-memory / persisted state
// Not rendered in production builds.
const DebugPanel: React.FC<DebugPanelProps> = ({ groups, transactions }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedGroups, setFetchedGroups] = useState<Group[] | null>(null);
  const [fetchedTransactions, setFetchedTransactions] = useState<Transaction[] | null>(null);

  if (process.env.NODE_ENV === 'production') return null;

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, t] = await Promise.all([api.getGroups(), api.getTransactions()]);
      setFetchedGroups(g);
      setFetchedTransactions(t);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const activeGroups = fetchedGroups || groups;
  const activeTransactions = fetchedTransactions || transactions;

  const txPerGroup = activeGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = activeTransactions.filter(t => t.groupId === g.id).length;
    return acc;
  }, {});

  const copyJson = () => {
    const payload = { groups: activeGroups, transactions: activeTransactions };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs font-mono">
      <button
        onClick={() => setOpen(o => !o)}
        className="mb-2 px-2 py-1 rounded-md bg-black/70 text-white border border-white/20 hover:bg-black/90"
        aria-expanded={open}
        aria-controls="debug-panel"
      >
        {open ? 'Close Debug' : 'Debug'}
      </button>
      {open && (
        <div id="debug-panel" className="w-[340px] max-h-[60vh] overflow-y-auto p-3 rounded-lg bg-slate-900/90 backdrop-blur border border-white/15 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">State Snapshot</h3>
            <div className="flex gap-2">
              <button onClick={handleRefresh} disabled={loading} className="px-2 py-0.5 rounded bg-indigo-600/60 hover:bg-indigo-600 text-white disabled:opacity-50">{loading ? '...' : 'Refresh'}</button>
              <button onClick={copyJson} className="px-2 py-0.5 rounded bg-sky-600/60 hover:bg-sky-600 text-white">Copy JSON</button>
            </div>
          </div>
          {error && <p className="text-rose-400">{error}</p>}
          <section>
            <p className="text-slate-400 mb-1">Groups ({activeGroups.length})</p>
            <ul className="space-y-1">
              {activeGroups.map(g => (
                <li key={g.id} className="border border-white/10 rounded p-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium text-slate-100" title={g.name}>{g.name}</span>
                    <span className="text-slate-500">{txPerGroup[g.id]} tx</span>
                  </div>
                  <div className="text-slate-500 truncate" title={g.id}>{g.id}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {g.groupType}{g.tripStartDate && g.tripEndDate && ` | ${g.tripStartDate} → ${g.tripEndDate}`}
                  </div>
                  <div className="text-[10px] text-slate-500">Members: {g.members.length}</div>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="text-slate-400 mt-3 mb-1">Transactions ({activeTransactions.length})</p>
            <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {activeTransactions.slice(0, 25).map(t => (
                <li key={t.id} className="border border-white/10 rounded p-1">
                  <div className="flex justify-between">
                    <span className="truncate" title={t.description}>{t.description}</span>
                    <span className="text-slate-500">{t.amount}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate" title={t.id}>{t.id}</div>
                </li>
              ))}
            </ul>
            {activeTransactions.length > 25 && <p className="text-[10px] text-slate-500 mt-1">(+ {activeTransactions.length - 25} more)</p>}
          </section>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;

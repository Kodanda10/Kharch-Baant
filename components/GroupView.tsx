import React, { useState, useMemo, useRef } from 'react';
import { Group, Transaction, Person, Filter, SortOption, GROUP_TYPES } from '../types';
import Dashboard from './Dashboard';
import MemberBalances from './MemberBalances';
import TransactionList from './TransactionList';
import FilterBar from './FilterBar';
import { SettingsIcon, HomeIcon, PlusIcon, ShareIcon } from './icons/Icons';
import html2canvas from 'html2canvas';
import ShareModal from './ShareModal';
import Avatar from './Avatar';
import DateFilterModal from './DateFilterModal';

interface GroupViewProps {
  group: Group;
  transactions: Transaction[];
  people: Person[];
  currentUserId: string;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onEditGroup: () => void;
  onGoHome: () => void;
}

const GroupView: React.FC<GroupViewProps> = ({
  group,
  transactions,
  people,
  currentUserId,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onEditGroup,
  onGoHome,
}) => {
  if (!group) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const [filters, setFilters] = useState<Filter>({ tag: 'all' });
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const groupMembers = useMemo(
    () => people.filter((p) => group.members.includes(p.id)),
    [people, group.members]
  );

  const groupTypeLabel = useMemo(() => {
    return GROUP_TYPES.find(option => option.value === group.groupType)?.label || 'Other';
  }, [group.groupType]);

  const tripRange = useMemo(() => {
    if (!group.tripStartDate || !group.tripEndDate) return '';
    const start = new Date(group.tripStartDate + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const end = new Date(group.tripEndDate + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `${start} - ${end}`;
  }, [group.tripStartDate, group.tripEndDate]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // --- CATEGORY/TAG FILTER ---
    if (filters.tag !== 'all') {
      filtered = filtered.filter((t) => t.tag === filters.tag);
    }

    // --- DATE RANGE FILTER ---
    if (filters.dateRange?.start && filters.dateRange?.end) {
      const startDate = new Date(filters.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter((t) => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
      });
    }

    // --- TEXT SEARCH (safe if description is missing) ---
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => (t.description ?? '').toLowerCase().includes(q));
    }

    // --- SORTING (fixed amount sorting) ---
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return (b.amount ?? 0) - (a.amount ?? 0);
        case 'amount-asc':
          return (a.amount ?? 0) - (b.amount ?? 0);
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [transactions, filters, sortOption, searchQuery]);

  // Compute simplified balances map for suggestion logic
  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    groupMembers.forEach(m => map.set(m.id, 0));
    transactions.forEach(t => {
      // credit payer
      map.set(t.paidById, (map.get(t.paidById) || 0) + t.amount);
      // debit shares
      const sharesTotal = t.split.participants;
      sharesTotal.forEach(p => {
        map.set(p.personId, (map.get(p.personId) || 0) - p.value);
      });
    });
    return map;
  }, [transactions, groupMembers]);

  const topSuggestion = useMemo(() => {
    const positives: { id: string; value: number }[] = [];
    const negatives: { id: string; value: number }[] = [];
    balanceMap.forEach((v, id) => {
      if (v > 0.01) positives.push({ id, value: v });
      else if (v < -0.01) negatives.push({ id, value: v });
    });
    if (!positives.length || !negatives.length) return null;
    positives.sort((a,b)=> b.value - a.value);
    negatives.sort((a,b)=> a.value - b.value); // most negative first
    const creditor = positives[0];
    const debtor = negatives[0];
    const suggestedAmount = Math.min(creditor.value, Math.abs(debtor.value));
    return { creditor, debtor, amount: suggestedAmount };
  }, [balanceMap]);

  const handleShare = async () => {
    const elementToCapture = summaryRef.current;
    if (elementToCapture) {
      elementToCapture.classList.add('bg-slate-900', 'p-4');
      const canvas = await html2canvas(elementToCapture, {
        backgroundColor: '#0f172a',
        useCORS: true,
      });
      elementToCapture.classList.remove('bg-slate-900', 'p-4');
      const dataUrl = canvas.toDataURL('image/png');
      setShareImageDataUrl(dataUrl);
      setIsShareModalOpen(true);
    }
  };

  const handleApplyDateFilter = (range: { start: string; end: string }) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
    setIsDateFilterOpen(false);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-900">
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10 p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onGoHome}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors md:hidden"
          >
            <HomeIcon />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{group.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs uppercase tracking-wide text-slate-400">
              <span>{groupTypeLabel}</span>
              {tripRange && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{tripRange}</span>
              )}
            </div>
            <div className="flex items-center -space-x-2 mt-1">
              {groupMembers.slice(0, 5).map((member) => (
                <Avatar key={member.id} person={member} size="sm" />
              ))}
              {groupMembers.length > 5 && (
                <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-800">
                  +{groupMembers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('Edit group button clicked');
              onEditGroup();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <SettingsIcon />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ShareIcon />
          </button>
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div ref={summaryRef}>
          <Dashboard
            transactions={transactions}
            people={people}
            currentUserId={currentUserId}
            currency={group.currency}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Transactions</h2>
            {topSuggestion && (
              <div className="mb-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-3 flex flex-col gap-2 text-xs text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-wide">Suggestion</span>
                  <span>
                    {groupMembers.find(m=>m.id===topSuggestion.debtor.id)?.name} → {groupMembers.find(m=>m.id===topSuggestion.creditor.id)?.name} should settle approximately <strong>{new Intl.NumberFormat('en-US', {style:'currency', currency: group.currency}).format(topSuggestion.amount)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Emit custom event; App currently opens SettleUp manually, so console hint.
                      window.dispatchEvent(new CustomEvent('open-settle-up', { detail: { payerId: topSuggestion.debtor.id, receiverId: topSuggestion.creditor.id, amount: topSuggestion.amount } }));
                      // Fallback: alert user to open Settle Up.
                      console.log('Settle suggestion event dispatched');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium"
                  >
                    Settle This
                  </button>
                  <span className="text-slate-500">Based on current net balances.</span>
                </div>
              </div>
            )}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              sortOption={sortOption}
              onSortChange={setSortOption}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onDateFilterClick={() => setIsDateFilterOpen(true)}
            />
            <TransactionList
              transactions={filteredTransactions}
              people={people}
              currentUserId={currentUserId}
              currency={group.currency}
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Balances</h2>
            <MemberBalances
              transactions={transactions}
              people={groupMembers}
              currency={group.currency}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </main>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageDataUrl={shareImageDataUrl}
        groupName={group.name}
      />

      <DateFilterModal
        isOpen={isDateFilterOpen}
        onClose={() => setIsDateFilterOpen(false)}
        onApply={handleApplyDateFilter}
        currentRange={filters.dateRange}
      />
    </div>
  );
};

export default GroupView;

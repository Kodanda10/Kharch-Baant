
import React, { useState, useMemo, useRef } from 'react';
import { Group, Transaction, Person, Filter, SortOption } from '../types';
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

const GroupView: React.FC<GroupViewProps> = ({ group, transactions, people, currentUserId, onAddTransaction, onEditTransaction, onDeleteTransaction, onEditGroup, onGoHome }) => {
    const [filters, setFilters] = useState<Filter>({ personId: 'all', tag: 'all' });
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareImageDataUrl, setShareImageDataUrl] = useState('');
    const summaryRef = useRef<HTMLDivElement>(null);
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    const groupMembers = useMemo(() => people.filter(p => group.members.includes(p.id)), [people, group.members]);

    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];

        // Person Filter Logic
        if (filters.personId !== 'all') {
            filtered = filtered.filter(t => {
                // A person is involved if they paid for the transaction...
                const isPayer = t.paidById === filters.personId;
                
                // ...or if they were one of the people the transaction was split with.
                const isParticipant = t.split.participants.some(
                    p => p.personId === filters.personId
                );
                
                return isPayer || isParticipant;
            });
        }

        // Category Filter Logic
        if (filters.tag !== 'all') {
            filtered = filtered.filter(t => t.tag === filters.tag);
        }

        // Date Filter Logic
        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filters.dateRange.end);
            endDate.setHours(23, 59, 59, 999);

            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }

        // Search Filter Logic
        if (searchQuery) {
            filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sorting Logic
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return filtered;
    }, [transactions, filters, sortOption, searchQuery]);

    const handleShare = async () => {
        const elementToCapture = summaryRef.current;
        if (elementToCapture) {
             // Temporarily add a class for styling during capture
            elementToCapture.classList.add('bg-slate-900', 'p-4');
            const canvas = await html2canvas(elementToCapture, { 
                backgroundColor: '#0f172a', // slate-900
                useCORS: true,
            });
             elementToCapture.classList.remove('bg-slate-900', 'p-4');
            const dataUrl = canvas.toDataURL('image/png');
            setShareImageDataUrl(dataUrl);
            setIsShareModalOpen(true);
        }
    };
    
    const handleApplyDateFilter = (range: { start: string; end: string }) => {
        setFilters(prev => ({ ...prev, dateRange: range }));
        setIsDateFilterOpen(false);
    };

    return (
        <div className="flex-1 w-full h-full flex flex-col bg-slate-900">
             <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10 p-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                     <button onClick={onGoHome} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors md:hidden">
                        <HomeIcon />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">{group.name}</h1>
                         <div className="flex items-center -space-x-2 mt-1">
                            {groupMembers.slice(0, 5).map(member => (
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
                     <button onClick={onEditGroup} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <SettingsIcon />
                    </button>
                    <button onClick={handleShare} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <ShareIcon />
                    </button>
                    <button onClick={onAddTransaction} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm font-medium">
                        <PlusIcon className="h-5 w-5"/>
                        <span className="hidden sm:inline">Add Expense</span>
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div ref={summaryRef}>
                    <Dashboard transactions={transactions} people={people} currentUserId={currentUserId} currency={group.currency} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-4 text-slate-300">Transactions</h2>
                        <FilterBar 
                            people={groupMembers}
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
                        <MemberBalances transactions={transactions} people={groupMembers} currency={group.currency} currentUserId={currentUserId} />
                    </div>
                </div>
            </main>
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} imageDataUrl={shareImageDataUrl} groupName={group.name} />
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
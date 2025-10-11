import React, { useMemo, useState } from 'react';
import { Group, Transaction, Person } from '../types';
import GroupSummaryCard from './GroupSummaryCard';
import { PlusIcon } from './icons/Icons';
import { calculateShares } from '../utils/calculations';
import Avatar from './Avatar';

interface HomeScreenProps {
    groups: Group[];
    transactions: Transaction[];
    people: Person[];
    currentUserId: string;
    onSelectGroup: (groupId: string) => void;
    onAddAction: () => void;
}

// Inline component for balance breakdown
const BalanceBreakdownContent: React.FC<{
    type: 'owed' | 'owing';
    groups: Group[];
    transactions: Transaction[];
    people: Person[];
    currentUserId: string;
    onSelectGroup: (groupId: string) => void;
}> = ({ type, groups, transactions, people, currentUserId, onSelectGroup }) => {
    console.log('BalanceBreakdownContent render:', { type, groups: groups.length, transactions: transactions.length });
    
    const balanceData = useMemo(() => {
        const personBalances: Array<{
            personId: string;
            person: Person;
            amount: number;
            groupId: string;
            groupName: string;
        }> = [];

        const activeGroups = groups.filter(g => !g.isArchived);

        // Use same logic as HomeScreen balance calculation
        transactions.forEach(transaction => {
            const group = activeGroups.find(g => g.id === transaction.groupId);
            if (!group) return;

            const shares = calculateShares(transaction);
            const userShare = shares.get(currentUserId) || 0;

            if (transaction.paidById === currentUserId) {
                // Current user paid, others owe them
                shares.forEach((shareAmount, personId) => {
                    if (personId !== currentUserId && shareAmount > 0.01) {
                        const person = people.find(p => p.id === personId);
                        if (person && type === 'owed') {
                            personBalances.push({
                                personId,
                                person,
                                amount: shareAmount,
                                groupId: group.id,
                                groupName: group.name
                            });
                        }
                    }
                });
            } else if (userShare > 0.01) {
                // Someone else paid, current user owes them
                const payer = people.find(p => p.id === transaction.paidById);
                if (payer && type === 'owing') {
                    personBalances.push({
                        personId: transaction.paidById,
                        person: payer,
                        amount: userShare,
                        groupId: group.id,
                        groupName: group.name
                    });
                }
            }
        });

        return personBalances.sort((a, b) => b.amount - a.amount);
    }, [type, groups, transactions, people, currentUserId]);
    
    console.log('Balance data calculated:', balanceData.length, 'items');
    
    // Add a simple test to see if component renders
    if (!type || !groups || !transactions || !people) {
        console.log('Missing required props:', { type, groups: !!groups, transactions: !!transactions, people: !!people });
        return <div className="text-red-400">Error: Missing required data</div>;
    }

    // Group balance data by group
    const groupedBalances = useMemo(() => {
        const grouped: Record<string, Array<{
            personId: string;
            person: Person;
            amount: number;
            groupId: string;
            groupName: string;
        }>> = {};
        
        balanceData.forEach(item => {
            if (!grouped[item.groupId]) {
                grouped[item.groupId] = [];
            }
            grouped[item.groupId].push(item);
        });
        
        return grouped;
    }, [balanceData]);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        return balanceData.reduce((sum, item) => sum + item.amount, 0);
    }, [balanceData]);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (balanceData.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p>No outstanding {type === 'owed' ? 'amounts owed to you' : 'amounts you owe'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Total Balance Summary */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">
                        Total {type === 'owed' ? 'you are owed' : 'you owe'}
                    </div>
                    <div className={`text-2xl font-bold ${
                        type === 'owed' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                        ₹{formatAmount(totalAmount)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        across {Object.keys(groupedBalances).length} groups
                    </div>
                </div>
            </div>

            {/* Grouped Balance Items */}
            {Object.entries(groupedBalances).map(([groupId, items]) => {
                const groupTotal = (items as typeof balanceData).reduce((sum, item) => sum + item.amount, 0);
                
                return (
                    <div key={groupId} className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/50">
                        <div 
                            className="flex items-center justify-between mb-3 cursor-pointer hover:bg-slate-600/20 -m-2 p-2 rounded"
                            onClick={() => onSelectGroup(groupId)}
                        >
                            <div>
                                <h3 className="font-medium text-slate-200">{items[0].groupName}</h3>
                                <p className="text-xs text-slate-400">Click to view group</p>
                            </div>
                            <div className={`font-semibold ${
                                type === 'owed' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                ₹{formatAmount(groupTotal)}
                            </div>
                        </div>
                        
                        <div className="space-y-2 ml-2">
                            {(items as typeof balanceData).map((item, index) => {
                                if (!item.person) {
                                    return null;
                                }
                                
                                return (
                                    <div
                                        key={`${item.personId}-${index}`}
                                        className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar person={item.person} size="sm" />
                                            <div className="text-sm text-slate-300">
                                                {item.person.name}
                                            </div>
                                        </div>
                                        <div className={`text-sm font-medium ${
                                            type === 'owed' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                            ₹{formatAmount(item.amount)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ groups, transactions, people, currentUserId, onSelectGroup, onAddAction }) => {
    const [balanceModalType, setBalanceModalType] = useState<'owed' | 'owing' | null>(null);
    
    const { totalOwedToUser, totalUserOwes, netBalance } = useMemo(() => {
        let owedToUser = 0;
        let userOwes = 0;

        // Note: This is a simplified calculation that doesn't account for different currencies.
        // In a real app, you would convert all amounts to a base currency.
        transactions.forEach(t => {
            const shares = calculateShares(t);
            const userShare = shares.get(currentUserId) || 0;

            if (t.paidById === currentUserId) {
                // User paid, so they are owed what others were supposed to pay
                owedToUser += (t.amount - userShare);
            } else {
                // Someone else paid, and the user has a share
                userOwes += userShare;
            }
        });
        
        const net = owedToUser - userOwes;

        return {
            totalOwedToUser: owedToUser,
            totalUserOwes: userOwes,
            netBalance: net,
        };
    }, [transactions, currentUserId]);
    
    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const groupTransactionsMap = useMemo(() => {
        const map = new Map<string, Transaction[]>();
        transactions.forEach(t => {
            if (!map.has(t.groupId)) {
                map.set(t.groupId, []);
            }
            map.get(t.groupId)!.push(t);
        });
        return map;
    }, [transactions]);


    return (
        <div className="flex-1 w-full h-full overflow-y-auto">
            <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10 p-4 md:p-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                 <button
                    onClick={onAddAction}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm font-medium"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Add New</span>
                </button>
            </header>
            <main className="p-4 md:p-6 space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-slate-300">Overall Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <button
                            onClick={() => {
                                console.log('Opening owed modal');
                                setBalanceModalType('owed');
                            }}
                            className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
                        >
                            <h3 className="text-sm font-medium text-slate-400">Total you are owed</h3>
                            <p className="text-3xl font-bold text-emerald-400 mt-2">{formatNumber(totalOwedToUser)}</p>
                            <p className="text-xs text-slate-500">(across all currencies)</p>
                            <p className="text-xs text-slate-400 mt-2">Click to view details</p>
                        </button>
                        <button
                            onClick={() => {
                                console.log('Opening owing modal');
                                setBalanceModalType('owing');
                            }}
                            className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
                        >
                            <h3 className="text-sm font-medium text-slate-400">Total you owe</h3>
                            <p className="text-3xl font-bold text-rose-400 mt-2">{formatNumber(totalUserOwes)}</p>
                             <p className="text-xs text-slate-500">(across all currencies)</p>
                             <p className="text-xs text-slate-400 mt-2">Click to view details</p>
                        </button>
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
                            <h3 className="text-sm font-medium text-slate-400">Total Net Balance</h3>
                            <p className={`text-3xl font-bold mt-2 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatNumber(netBalance)}
                            </p>
                             <p className="text-xs text-slate-500">(across all currencies)</p>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-slate-300">Your Groups</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.filter(g => !g.isArchived).map(group => (
                                      <GroupSummaryCard 
                                          key={group.id}
                                          group={group}
                                          transactions={groupTransactionsMap.get(group.id) || []}
                                          people={people}
                                          currentUserId={currentUserId}
                                          onSelectGroup={onSelectGroup}
                                      />
                                ))}
                    </div>
                </section>
            </main>
            
            {/* Balance Breakdown Modal */}
            {balanceModalType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">
                                {balanceModalType === 'owed' ? 'Amount You Are Owed' : 'Amount You Owe'}
                            </h2>
                            <button
                                onClick={() => setBalanceModalType(null)}
                                className="text-slate-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="text-slate-400 text-sm mb-4">
                            {balanceModalType === 'owed' 
                                ? 'People who owe you money across all groups' 
                                : 'People you owe money to across all groups'
                            }
                        </div>

                        <div className="text-slate-300 text-sm mb-4">
                            Debug: Type = {balanceModalType}, Groups = {groups.length}, Transactions = {transactions.length}
                        </div>
                        
                        {console.log('About to render BalanceBreakdownContent with:', { balanceModalType, groups: groups.length, transactions: transactions.length, people: people.length })}
                        
                        <BalanceBreakdownContent 
                            type={balanceModalType}
                            groups={groups}
                            transactions={transactions}
                            people={people}
                            currentUserId={currentUserId}
                            onSelectGroup={(groupId) => {
                                setBalanceModalType(null);
                                onSelectGroup(groupId);
                            }}
                        />

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setBalanceModalType(null)}
                                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeScreen;
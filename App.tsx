import React, { useState, useEffect } from 'react';
import { Group, Transaction, Person, PaymentSource } from './types';
import { CURRENT_USER_ID } from './constants';
import * as api from './services/apiService';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import TransactionFormModal from './components/TransactionFormModal';
import GroupFormModal from './components/GroupFormModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import HomeScreen from './components/HomeScreen';
import PaymentSourceFormModal from './components/PaymentSourceFormModal';
import PaymentSourceManageModal from './components/PaymentSourceManageModal';
import SettleUpModal from './components/SettleUpModal';
import ApiStatusIndicator from './components/ApiStatusIndicator';
import DebugPanel from './components/DebugPanel';
import AddActionModal from './components/AddActionModal';
import { assertSupabaseEnvironment } from './services/apiService';

const App: React.FC = () => {
    // Warn early if env variables missing (no throw — supabase.ts will still throw on actual usage)
    if (import.meta.env.DEV) {
        assertSupabaseEnvironment();
    }
    const [groups, setGroups] = useState<Group[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [currentUserId] = useState<string>(CURRENT_USER_ID);
    const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    // Start with no group selected to show the HomeScreen
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
    const [isPaymentSourceModalOpen, setIsPaymentSourceModalOpen] = useState(false);
    const [isPaymentSourceManageOpen, setIsPaymentSourceManageOpen] = useState(false);
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
    const [defaultSettlePayer, setDefaultSettlePayer] = useState<string | undefined>(undefined);
    const [defaultSettleReceiver, setDefaultSettleReceiver] = useState<string | undefined>(undefined);
    const [defaultSettleAmount, setDefaultSettleAmount] = useState<number | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState<Transaction | null>(null);
    const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
    const [pendingDeletePaymentSource, setPendingDeletePaymentSource] = useState<PaymentSource | null>(null);
    const [isDeletingPaymentSource, setIsDeletingPaymentSource] = useState(false);

    const paymentSourceUsageCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.paymentSourceId) {
                counts[t.paymentSourceId] = (counts[t.paymentSourceId] || 0) + 1;
            }
        });
        return counts;
    }, [transactions]);

    const paymentSourceLastUsed = React.useMemo(() => {
        const last: Record<string, string> = {};
        transactions.forEach(t => {
            if (t.paymentSourceId) {
                const prev = last[t.paymentSourceId];
                if (!prev || prev < t.date) {
                    last[t.paymentSourceId] = t.date; // dates are YYYY-MM-DD so lexical compare works
                }
            }
        });
        return last;
    }, [transactions]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [groupsData, transactionsData, paymentSourcesData, peopleData] = await Promise.all([
                    api.getGroups(),
                    api.getTransactions(),
                    api.getPaymentSources(), // active only
                    api.getPeople(),
                ]);
                setGroups(groupsData);
                setTransactions(transactionsData);
                setPaymentSources(paymentSourcesData);
                setPeople(peopleData);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSelectGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
    };

    const handleGoHome = () => {
        setSelectedGroupId(null);
    };

    const handleAddTransactionClick = () => {
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
    };

    const handleEditTransactionClick = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    const requestDeleteTransaction = (id: string) => {
        const tx = transactions.find(t => t.id === id) || null;
        setPendingDeleteTransaction(tx);
    };

    const handleConfirmDeleteTransaction = async () => {
        if (!pendingDeleteTransaction) return;
        setIsDeletingTransaction(true);
        try {
            await api.deleteTransaction(pendingDeleteTransaction.id);
            setTransactions(prev => prev.filter(t => t.id !== pendingDeleteTransaction.id));
            setPendingDeleteTransaction(null);
        } catch (error) {
            console.error('Failed to delete transaction', error);
        } finally {
            setIsDeletingTransaction(false);
        }
    };

    const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id' | 'groupId'>) => {
        if (!selectedGroupId && !editingTransaction) return;
        try {
            if (editingTransaction) {
                const updatedTransaction = await api.updateTransaction(editingTransaction.id, transactionData);
                setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t));
            } else if (selectedGroupId) {
                const newTransaction = await api.addTransaction(selectedGroupId, transactionData);
                setTransactions(prev => [...prev, newTransaction]);
            }
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Failed to save transaction', error);
        }
    };
    
    const handleAddGroupClick = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleEditGroupClick = () => {
        console.log('handleEditGroupClick called, selectedGroupId:', selectedGroupId);
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        console.log('Found group:', selectedGroup);
        if (selectedGroup) {
            setEditingGroup(selectedGroup);
            setIsGroupModalOpen(true);
            console.log('Modal should now be open with editingGroup:', selectedGroup);
        } else {
            console.log('No group found with id:', selectedGroupId);
        }
    };

    const handleSaveGroup = async (groupData: Omit<Group, 'id'>) => {
         try {
            if (editingGroup) {
                console.log('Updating group:', editingGroup.id, 'with data:', groupData);
                const updatedGroup = await api.updateGroup(editingGroup.id, groupData);
                console.log('Updated group result:', updatedGroup);
                setGroups(prev => prev.map(g => 
                    g.id === editingGroup.id ? updatedGroup : g
                ));
                console.log('Groups state updated successfully');
            } else {
                console.log('Adding new group with data:', groupData);
                const newGroup = await api.addGroup(groupData);
                console.log('New group result:', newGroup);
                setGroups(prev => [...prev, newGroup]);
                setSelectedGroupId(newGroup.id);
            }
            // Only close modal and reset state if API call succeeded
            setIsGroupModalOpen(false);
            setEditingGroup(null);
            console.log('Modal closed and state reset');
         } catch (error) {
             console.error("Failed to save group", error);
             alert(`Error saving group: ${error?.message || error}`);
             // Don't close the modal if there's an error
             return;
         }
    };

    // Add Action Modal handlers
    const handleAddActionClick = () => {
        setIsAddActionModalOpen(true);
    };

    const handleSelectGroupForExpense = (groupId: string) => {
        setSelectedGroupId(groupId);
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
    };

    const handleCreateGroupFromAddAction = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleSavePaymentSource = async (sourceData: Omit<PaymentSource, 'id'>) => {
        try {
            const newSource = await api.addPaymentSource(sourceData);
            setPaymentSources(prev => [...prev, newSource]);
            setIsPaymentSourceModalOpen(false);
        } catch(error) {
            console.error("Failed to save payment source", error);
        }
    };

    const requestDeletePaymentSource = (id: string) => {
        const src = paymentSources.find(p => p.id === id) || null;
        if (src) setPendingDeletePaymentSource(src);
    };

    const handleArchivePaymentSource = async (id: string) => {
        try {
            await api.archivePaymentSource(id);
            setPaymentSources(prev => prev.map(ps => ps.id === id ? { ...ps, isActive: false } : ps));
        } catch (e) {
            console.error('Failed to archive payment source', e);
            alert('Archiving failed. Ensure migration for is_active column is applied if using soft delete.');
        }
    };

    // Lazy-load archived sources only when management modal opens
    useEffect(() => {
        if (isPaymentSourceManageOpen) {
            (async () => {
                try {
                    const allSources = await api.getPaymentSources({ includeArchived: true });
                    setPaymentSources(allSources);
                } catch (e) {
                    console.error('Failed to fetch archived payment sources', e);
                }
            })();
        }
    }, [isPaymentSourceManageOpen]);

    // Listen for settle suggestion events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            setDefaultSettlePayer(detail.payerId);
            setDefaultSettleReceiver(detail.receiverId);
            setDefaultSettleAmount(detail.amount);
            setIsSettleUpOpen(true);
        };
        window.addEventListener('open-settle-up', handler as EventListener);
        return () => window.removeEventListener('open-settle-up', handler as EventListener);
    }, []);

    const handleConfirmDeletePaymentSource = async () => {
        if (!pendingDeletePaymentSource) return;
        setIsDeletingPaymentSource(true);
        try {
            // Optional pre-check: ensure no transactions reference it. For now we allow deletion even if referenced.
            await api.deletePaymentSource(pendingDeletePaymentSource.id);
            setPaymentSources(prev => prev.filter(ps => ps.id !== pendingDeletePaymentSource.id));
            // Also clear from any editing transaction state (defensive)
            setTransactions(prev => prev.map(t => t.paymentSourceId === pendingDeletePaymentSource.id ? { ...t, paymentSourceId: undefined } : t));
            setPendingDeletePaymentSource(null);
        } catch (error) {
            console.error('Failed to delete payment source', error);
            alert('Failed to delete payment source. It might be referenced by transactions.');
        } finally {
            setIsDeletingPaymentSource(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <p className="text-xl">Loading your expenses...</p>
            </div>
        );
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const groupTransactions = transactions.filter(t => t.groupId === selectedGroupId);
    const groupMembers = selectedGroup ? people.filter(p => selectedGroup.members.includes(p.id)) : [];

    return (
        <div className="h-screen w-screen text-slate-200 flex font-sans">
            {selectedGroup ? (
                <>
                    <GroupList
                        groups={groups}
                        people={people}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={handleSelectGroup}
                        onAddAction={handleAddActionClick}
                        onGoHome={handleGoHome}
                    />
                    <GroupView
                        group={selectedGroup}
                        transactions={groupTransactions}
                        people={people}
                        currentUserId={currentUserId}
                        onAddExpense={() => setIsTransactionModalOpen(true)}
                        onSettleUp={() => setIsSettleUpOpen(true)}
                        onEditTransaction={handleEditTransactionClick}
                        onDeleteTransaction={requestDeleteTransaction}
                        onEditGroup={handleEditGroupClick}
                        onGoHome={handleGoHome}
                    />
                </>
            ) : (
                <HomeScreen 
                    groups={groups}
                    transactions={transactions}
                    people={people}
                    currentUserId={currentUserId}
                    onSelectGroup={handleSelectGroup}
                    onAddAction={handleAddActionClick}
                />
            )}
            
            {isTransactionModalOpen && selectedGroup && (
                 <TransactionFormModal
                    isOpen={isTransactionModalOpen}
                    onClose={() => setIsTransactionModalOpen(false)}
                    onSave={handleSaveTransaction}
                    transaction={editingTransaction}
                    people={groupMembers}
                    currentUserId={currentUserId}
                    paymentSources={paymentSources}
                    onAddNewPaymentSource={() => setIsPaymentSourceModalOpen(true)}
                />
            )}
            
            {isGroupModalOpen && (
                <GroupFormModal
                    isOpen={isGroupModalOpen}
                    onClose={() => setIsGroupModalOpen(false)}
                    onSave={handleSaveGroup}
                    group={editingGroup}
                    allPeople={people}
                    currentUserId={currentUserId}
                />
            )}

            {isPaymentSourceModalOpen && (
                <PaymentSourceFormModal
                    isOpen={isPaymentSourceModalOpen}
                    onClose={() => setIsPaymentSourceModalOpen(false)}
                    onSave={handleSavePaymentSource}
                />
            )}

            {/* Confirm Delete Transaction Modal */}
            {pendingDeleteTransaction && (
                <ConfirmDeleteModal
                    open={!!pendingDeleteTransaction}
                    entityType="transaction"
                    entityName={pendingDeleteTransaction.description}
                    impactDescription="Balances will recalculate after deletion. This cannot be undone."
                    onCancel={() => setPendingDeleteTransaction(null)}
                    onConfirm={async () => {
                        await handleConfirmDeleteTransaction();
                    }}
                />
            )}

            {pendingDeletePaymentSource && (
                <ConfirmDeleteModal
                    open={!!pendingDeletePaymentSource}
                    entityType="paymentSource"
                    entityName={pendingDeletePaymentSource.name}
                    impactDescription={`This source is referenced in ${paymentSourceUsageCounts[pendingDeletePaymentSource.id] || 0} transaction(s). ${paymentSourceLastUsed[pendingDeletePaymentSource.id] ? `Last used on ${paymentSourceLastUsed[pendingDeletePaymentSource.id]}. ` : ''}After deletion those transactions will display no payment source. This cannot be undone.`}
                    loading={isDeletingPaymentSource}
                    onCancel={() => setPendingDeletePaymentSource(null)}
                    onConfirm={async () => { await handleConfirmDeletePaymentSource(); }}
                />
            )}

            {/* Manage Payment Sources: only exposed outside active group view (e.g., via Home or Settings) */}
            {!selectedGroup && (
                <button
                    onClick={() => setIsPaymentSourceManageOpen(true)}
                    className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-full shadow-lg"
                >
                    Manage Payment Sources
                </button>
            )}

            {isPaymentSourceManageOpen && (
                <PaymentSourceManageModal
                    isOpen={isPaymentSourceManageOpen}
                    onClose={() => setIsPaymentSourceManageOpen(false)}
                    paymentSources={paymentSources}
                    usageCounts={paymentSourceUsageCounts}
                    lastUsedMap={paymentSourceLastUsed}
                    onAddNew={() => {
                        setIsPaymentSourceManageOpen(false);
                        setIsPaymentSourceModalOpen(true);
                    }}
                    onRequestDelete={(id) => requestDeletePaymentSource(id)}
                    onArchive={(id) => handleArchivePaymentSource(id)}
                />
            )}

            {isSettleUpOpen && selectedGroup && (
                <SettleUpModal
                    open={isSettleUpOpen}
                    onClose={() => setIsSettleUpOpen(false)}
                    groupId={selectedGroup.id}
                    members={people.filter(p => selectedGroup.members.includes(p.id))}
                    paymentSources={paymentSources}
                    transactions={groupTransactions}
                    currency={selectedGroup.currency}
                    defaultPayerId={defaultSettlePayer}
                    defaultReceiverId={defaultSettleReceiver}
                    defaultAmount={defaultSettleAmount}
                    // pass default amount via comment hack handled inside modal's effect if needed (extending modal soon)
                    onCreated={(tx) => {
                        setTransactions(prev => [...prev, tx]);
                        setIsSettleUpOpen(false);
                        setDefaultSettleAmount(undefined);
                    }}
                />
            )}

            <AddActionModal
                open={isAddActionModalOpen}
                onClose={() => setIsAddActionModalOpen(false)}
                groups={groups}
                people={people}
                onCreateGroup={handleCreateGroupFromAddAction}
                onSelectGroupForExpense={handleSelectGroupForExpense}
                currentGroupId={selectedGroupId}
            />

            <ApiStatusIndicator />
            <DebugPanel groups={groups} transactions={transactions} />
        </div>
    );
};

export default App;
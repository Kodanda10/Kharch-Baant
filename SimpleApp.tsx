import React, { useState, useEffect } from 'react';
import { Group, Transaction, Person, PaymentSource } from './types';
import * as api from './services/apiService';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import TransactionFormModal from './components/TransactionFormModal';
import GroupFormModal from './components/GroupFormModal';
import { deleteGroup, archiveGroup } from './services/supabaseApiService';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import HomeScreen from './components/HomeScreen';
import PaymentSourceFormModal from './components/PaymentSourceFormModal';
import PaymentSourceManageModal from './components/PaymentSourceManageModal';
import SettleUpModal from './components/SettleUpModal';
import ArchivePromptModal from './components/ArchivePromptModal';
import ApiStatusIndicator from './components/ApiStatusIndicator';
import DebugPanel from './components/DebugPanel';
import AddActionModal from './components/AddActionModal';
import { assertSupabaseEnvironment } from './services/apiService';
import SettingsModal from './components/SettingsModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import { SettingsIcon } from './components/icons/Icons';

const SimpleApp: React.FC = () => {
    // Mock user for demo mode
    const currentUser = {
        id: 'demo-user-123',
        fullName: 'Demo User',
        firstName: 'Demo',
        primaryEmailAddress: { emailAddress: 'demo@example.com' },
        imageUrl: null
    };

    const [groups, setGroups] = useState<Group[]>([]);
    // Only show non-archived groups in main UI
    const activeGroups = groups.filter(g => !g.isArchived);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const currentUserId = currentUser?.id || 'demo-user-123';
    const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
    const [isPaymentSourceModalOpen, setIsPaymentSourceModalOpen] = useState(false);
    const [isPaymentSourceManageOpen, setIsPaymentSourceManageOpen] = useState(false);
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
    const [defaultSettlePayer, setDefaultSettlePayer] = useState<string | undefined>(undefined);
    const [defaultSettleReceiver, setDefaultSettleReceiver] = useState<string | undefined>(undefined);
    const [defaultSettleAmount, setDefaultSettleAmount] = useState<number | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showArchivePrompt, setShowArchivePrompt] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [isProcessingGroupAction, setIsProcessingGroupAction] = useState(false);
    const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

    // Calculate group balances
    const groupBalances = React.useMemo(() => {
        if (!selectedGroupId) return null;
        const groupTxs = transactions.filter(t => t.groupId === selectedGroupId);
        const balances: Record<string, number> = {};
        groupTxs.forEach(t => {
            balances[t.paidById] = (balances[t.paidById] || 0) + t.amount;
            t.split.participants.forEach(p => {
                balances[p.personId] = (balances[p.personId] || 0) - (t.amount / t.split.participants.length);
            });
        });
        return balances;
    }, [transactions, selectedGroupId]);

    // All settled if all balances are zero (within epsilon)
    const allSettled = Object.values(groupBalances ?? {}).every(b => typeof b === 'number' && Math.abs(b) < 0.01);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                assertSupabaseEnvironment();

                const [groupsData, transactionsData, peopleData, paymentSourcesData] = await Promise.all([
                    api.fetchGroups(),
                    api.fetchTransactions(),
                    api.fetchPeople(),
                    api.fetchPaymentSources()
                ]);

                setGroups(groupsData);
                setTransactions(transactionsData);
                setPeople(peopleData);
                setPaymentSources(paymentSourcesData);
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Event handlers
    const handleCreateGroup = async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newGroup = await api.createGroup(group);
        setGroups(prev => [newGroup, ...prev]);
        setIsGroupModalOpen(false);
    };

    const handleCreateTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTransaction = await api.createTransaction(transaction);
        setTransactions(prev => [newTransaction, ...prev]);
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
    };

    const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
        const updatedTransaction = await api.updateTransaction(id, updates);
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        await api.deleteTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleEditGroup = (group: Group) => {
        setEditingGroup(group);
        setIsGroupModalOpen(true);
    };

    const handleUpdateGroup = async (id: string, updates: Partial<Group>) => {
        setIsProcessingGroupAction(true);
        try {
            const updatedGroup = await api.updateGroup(id, updates);
            setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));
            setIsGroupModalOpen(false);
            setEditingGroup(null);
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setIsProcessingGroupAction(false);
        }
    };

    const handleDeleteGroup = (group: Group) => {
        setGroupToDelete(group);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;

        setIsProcessingGroupAction(true);
        try {
            // Demo-only: use placeholders for required args in deleteGroup
            await deleteGroup(groupToDelete.id, '', false, true);
            setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
            setTransactions(prev => prev.filter(t => t.groupId !== groupToDelete.id));

            if (selectedGroupId === groupToDelete.id) {
                setSelectedGroupId(null);
            }

            setGroupToDelete(null);
        } catch (error) {
            console.error('Error deleting group:', error);
        } finally {
            setIsProcessingGroupAction(false);
        }
    };

    const handleArchiveGroup = async (groupId: string) => {
        setIsProcessingGroupAction(true);
        try {
            const updatedGroup = await archiveGroup(groupId);
            setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));

            if (selectedGroupId === groupId) {
                setSelectedGroupId(null);
            }

            setShowArchivePrompt(false);
        } catch (error) {
            console.error('Error archiving group:', error);
        } finally {
            setIsProcessingGroupAction(false);
        }
    };

    const handleSelectGroupForExpense = (groupId: string) => {
        setSelectedGroupId(groupId);
        setIsTransactionModalOpen(true);
        setIsAddActionModalOpen(false);
    };

    const handleCreateGroupFromAddAction = async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newGroup = await api.createGroup(group);
        setGroups(prev => [newGroup, ...prev]);
        setIsAddActionModalOpen(false);
        setSelectedGroupId(newGroup.id);
        setIsTransactionModalOpen(true);
    };

    const openSettleUp = (payerId?: string, receiverId?: string, amount?: number) => {
        setEditingTransaction(null);
        setDefaultSettlePayer(payerId);
        setDefaultSettleReceiver(receiverId);
        setDefaultSettleAmount(amount);
        setIsSettleUpOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading your expense tracker...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {selectedGroupId ? (
                <GroupView
                    group={groups.find(g => g.id === selectedGroupId)!}
                    transactions={transactions.filter(t => t.groupId === selectedGroupId)}
                    people={people}
                    onBack={() => setSelectedGroupId(null)}
                    onAddTransaction={() => setIsTransactionModalOpen(true)}
                    onEditTransaction={(transaction) => {
                        setEditingTransaction(transaction);
                        if (transaction.type === 'settlement') {
                            setIsSettleUpOpen(true);
                        } else {
                            setIsTransactionModalOpen(true);
                        }
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditGroup={handleEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onArchiveGroup={() => setShowArchivePrompt(true)}
                    onSettleUp={openSettleUp}
                    onViewTransactionDetail={(transactionId) => {
                        setSelectedTransactionId(transactionId);
                        setIsTransactionDetailOpen(true);
                    }}
                    balances={groupBalances ?? {}}
                    allSettled={allSettled}
                    paymentSources={paymentSources}
                />
            ) : (
                <div className="flex-1 flex flex-col">
                    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
                        <h1 className="text-lg font-bold text-white">Kharch Baant</h1>
                        <div className="flex items-center gap-2">
                            {currentUser && (
                                <button
                                    onClick={() => setIsUserProfileOpen(true)}
                                    className="flex items-center gap-2 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="User Profile"
                                >
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {currentUser.firstName?.charAt(0).toUpperCase() || 'D'}
                                        </span>
                                    </div>
                                    <span className="hidden sm:inline text-sm">
                                        {currentUser.firstName || 'Demo User'}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Open App Settings"
                            >
                                <SettingsIcon />
                            </button>
                        </div>
                    </header>
                    <div className="flex-1">
                        <HomeScreen
                            groups={activeGroups}
                            transactions={transactions}
                            people={people}
                            onSelectGroup={setSelectedGroupId}
                            onCreateGroup={() => setIsGroupModalOpen(true)}
                            onCreateTransaction={() => setIsAddActionModalOpen(true)}
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {isTransactionModalOpen && (
                <TransactionFormModal
                    open={isTransactionModalOpen}
                    onClose={() => {
                        setIsTransactionModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onSubmit={editingTransaction ?
                        (transaction) => handleUpdateTransaction(editingTransaction.id, transaction) :
                        handleCreateTransaction
                    }
                    groups={groups}
                    people={people}
                    paymentSources={paymentSources}
                    currentUserId={currentUserId}
                    selectedGroupId={selectedGroupId}
                    transaction={editingTransaction}
                />
            )}

            {isGroupModalOpen && (
                <GroupFormModal
                    open={isGroupModalOpen}
                    onClose={() => {
                        setIsGroupModalOpen(false);
                        setEditingGroup(null);
                    }}
                    onSubmit={editingGroup ?
                        (group) => handleUpdateGroup(editingGroup.id, group) :
                        handleCreateGroup
                    }
                    people={people}
                    group={editingGroup}
                    isProcessing={isProcessingGroupAction}
                />
            )}

            {groupToDelete && (
                <ConfirmDeleteModal
                    open={!!groupToDelete}
                    onClose={() => setGroupToDelete(null)}
                    onConfirm={confirmDeleteGroup}
                    title={`Delete "${groupToDelete.name}"`}
                    message="This will permanently delete the group and all its transactions. This action cannot be undone."
                    isProcessing={isProcessingGroupAction}
                />
            )}

            {showArchivePrompt && selectedGroupId && (
                <ArchivePromptModal
                    open={showArchivePrompt}
                    onClose={() => setShowArchivePrompt(false)}
                    onArchive={() => handleArchiveGroup(selectedGroupId)}
                    groupName={groups.find(g => g.id === selectedGroupId)?.name || ''}
                    isProcessing={isProcessingGroupAction}
                />
            )}

            {isPaymentSourceModalOpen && (
                <PaymentSourceFormModal
                    open={isPaymentSourceModalOpen}
                    onClose={() => setIsPaymentSourceModalOpen(false)}
                    onSubmit={async (paymentSource) => {
                        const newPaymentSource = await api.createPaymentSource(paymentSource);
                        setPaymentSources(prev => [newPaymentSource, ...prev]);
                        setIsPaymentSourceModalOpen(false);
                    }}
                />
            )}

            {isPaymentSourceManageOpen && (
                <PaymentSourceManageModal
                    open={isPaymentSourceManageOpen}
                    onClose={() => setIsPaymentSourceManageOpen(false)}
                    paymentSources={paymentSources}
                    onUpdate={async (id, updates) => {
                        const updated = await api.updatePaymentSource(id, updates);
                        setPaymentSources(prev => prev.map(ps => ps.id === id ? updated : ps));
                    }}
                    onDelete={async (id) => {
                        await api.deletePaymentSource(id);
                        setPaymentSources(prev => prev.filter(ps => ps.id !== id));
                    }}
                    onCreate={() => {
                        setIsPaymentSourceManageOpen(false);
                        setIsPaymentSourceModalOpen(true);
                    }}
                />
            )}

            {isSettleUpOpen && selectedGroupId && (
                <SettleUpModal
                    open={isSettleUpOpen}
                    onClose={() => {
                        setIsSettleUpOpen(false);
                        setEditingTransaction(null);
                    }}
                    group={groups.find(g => g.id === selectedGroupId)!}
                    people={people}
                    balances={groupBalances ?? {}}
                    initialTransaction={editingTransaction?.type === 'settlement' ? editingTransaction : undefined}
                    onSubmit={async (tx) => {
                        if (editingTransaction && editingTransaction.type === 'settlement') {
                            const updated = await api.updateTransaction(editingTransaction.id, tx);
                            setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updated : t));
                            return updated;
                        } else {
                            const created = await api.createTransaction(tx);
                            setTransactions(prev => [created, ...prev]);
                            return created;
                        }
                    }}
                    paymentSources={paymentSources}
                    currentUserId={currentUserId}
                    defaultPayer={defaultSettlePayer}
                    defaultReceiver={defaultSettleReceiver}
                    defaultAmount={defaultSettleAmount}
                />
            )}

            {isTransactionDetailOpen && selectedTransactionId && (
                <TransactionDetailModal
                    open={isTransactionDetailOpen}
                    onClose={() => {
                        setIsTransactionDetailOpen(false);
                        setSelectedTransactionId(null);
                    }}
                    transaction={transactions.find(t => t.id === selectedTransactionId)!}
                    people={people}
                    paymentSources={paymentSources}
                />
            )}

            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onManagePaymentSources={() => {
                        setIsSettingsModalOpen(false);
                        setIsPaymentSourceManageOpen(true);
                    }}
                    currentUserId={currentUserId}
                    currentUserPerson={{
                        id: currentUser.id,
                        name: currentUser.fullName,
                        avatarUrl: currentUser.imageUrl
                    }}
                />
            )}

            <AddActionModal
                open={isAddActionModalOpen}
                onClose={() => setIsAddActionModalOpen(false)}
                groups={activeGroups}
                people={people}
                onCreateGroup={handleCreateGroupFromAddAction}
                onSelectGroupForExpense={handleSelectGroupForExpense}
                currentGroupId={selectedGroupId}
            />

            {isUserProfileOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">D</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Demo User</h2>
                            <p className="text-slate-300 text-sm">demo@example.com</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <h3 className="text-white font-medium mb-2">Demo Mode</h3>
                                <div className="text-sm text-slate-300 space-y-1">
                                    <p>You're using the expense tracker in demo mode</p>
                                    <p>All features are available for testing</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsUserProfileOpen(false)}
                                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ApiStatusIndicator />
            <DebugPanel groups={groups} transactions={transactions} />
        </div>
    );
};

export default SimpleApp;
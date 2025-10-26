import React, { useState, useEffect } from 'react';
import { Group, Transaction, Person, PaymentSource } from './types';
import * as api from './services/apiService';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import TransactionFormModal from './components/TransactionFormModal';
import GroupFormModal from './components/GroupFormModal';
import { deleteGroup, archiveGroup, validateInvite, acceptInvite } from './services/supabaseApiService';
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
import { useAuth } from './contexts/SupabaseAuthContext';
import { UserMenu } from './components/auth/UserMenu';
import { SignInForm } from './components/auth/SignInForm';
import { SignUpForm } from './components/auth/SignupForm';
import * as emailService from './services/emailService';

const App: React.FC = () => {
    // Warn early if env variables missing (no throw — supabase.ts will still throw on actual usage)
    if (import.meta.env.DEV) {
        assertSupabaseEnvironment();
    }
    
    // Get user from Supabase Auth (now we're inside the provider)
    const { user } = useAuth();
    
    const currentUser = user;
    
    const [groups, setGroups] = useState<Group[]>([]);
    // Only show non-archived groups in main UI
    const activeGroups = groups.filter(g => !g.isArchived);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [currentUserPerson, setCurrentUserPerson] = useState<Person | null>(null);
    const currentUserId = currentUserPerson?.id || '';
    
    // Debug: Log current user person and ID
    console.log('App: Current user person:', currentUserPerson);
    console.log('App: Current user ID:', currentUserId);
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
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [defaultSettlePayer, setDefaultSettlePayer] = useState<string | undefined>(undefined);
    const [defaultSettleReceiver, setDefaultSettleReceiver] = useState<string | undefined>(undefined);
    const [defaultSettleAmount, setDefaultSettleAmount] = useState<number | undefined>(undefined);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showArchivePrompt, setShowArchivePrompt] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [isProcessingGroupAction, setIsProcessingGroupAction] = useState(false);
    const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
    const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);


    // Calculate balances for selected group (simple sum for demo; replace with real logic)
    const groupBalances = React.useMemo(() => {
        if (!selectedGroupId) return {};
        const groupTxs = transactions.filter(t => t.groupId === selectedGroupId);
        // TODO: Replace with real balance calculation
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
    const userSettled = currentUserId && Math.abs((groupBalances?.[currentUserId] ?? 0)) < 0.01;
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

    // Handle invite acceptance
    const handleInviteAcceptance = async (inviteToken: string, personId: string) => {
        try {
            console.log('🎫 Validating invite token:', inviteToken);
            const validation = await validateInvite(inviteToken);
            
            if (!validation.isValid) {
                alert(`Invite link is invalid: ${validation.error}`);
                window.history.replaceState({}, '', '/'); // Clear URL
                return;
            }
            
            console.log('✅ Invite is valid for group:', validation.group?.name);
            
            // Accept the invite
            const result = await acceptInvite({
                inviteToken,
                personId
            });
            
            if (result.success) {
                console.log('✅ Successfully joined group:', result.group?.name);
                
                // Clear the invite URL
                window.history.replaceState({}, '', '/');
                
                // Manually fetch updated groups to include the new one
                const updatedGroups = await api.getGroups(personId);
                setGroups(updatedGroups);
                
                // Select the newly joined group
                if (result.group?.id) {
                    setSelectedGroupId(result.group.id);
                }
                
                alert(`Successfully joined group "${result.group?.name}"!`);
            } else {
                alert(`Failed to join group: ${result.error}`);
                // Clear the invite URL
                window.history.replaceState({}, '', '/');
            }
        } catch (error) {
            console.error('❌ Error handling invite:', error);
            alert(`Failed to process invite: ${error.message || error}`);
            window.history.replaceState({}, '', '/');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log('🔄 Starting data fetch for user:', currentUser?.id);
                
                // Ensure user exists in the database and get their Person record
                let userPerson = null;
                if (currentUser) {
                    console.log('👤 Creating/finding user person record...');
                    
                    // Check if this is the user's first login
                    const isFirstLogin = localStorage.getItem(`welcomed_${currentUser.id}`) !== 'true';
                    
                    userPerson = await api.ensureUserExists(
                        currentUser.id, 
                        currentUser.fullName || currentUser.firstName || 'User',
                        currentUser.primaryEmailAddress?.emailAddress || 'user@example.com'
                    );
                    console.log('✅ User person found/created:', userPerson);
                    setCurrentUserPerson(userPerson);
                    
                    // Send welcome email on first login
                    if (isFirstLogin && emailService.isEmailServiceEnabled()) {
                        console.log('📧 Sending welcome email to new user...');
                        emailService.sendWelcomeEmail({
                            userName: currentUser.fullName || currentUser.firstName || 'User',
                            userEmail: currentUser.primaryEmailAddress?.emailAddress || '',
                            loginMethod: 'email', // Could be enhanced to detect actual method
                        }).then(result => {
                            if (result.success) {
                                console.log('✅ Welcome email sent successfully');
                                // Mark user as welcomed
                                localStorage.setItem(`welcomed_${currentUser.id}`, 'true');
                            } else {
                                console.warn('⚠️ Welcome email failed:', result.error);
                            }
                        }).catch(err => {
                            console.error('❌ Welcome email error:', err);
                        });
                    }
                    
                    // Check for invite token in URL
                    const urlPath = window.location.pathname;
                    const inviteMatch = urlPath.match(/^\/invite\/(.+)$/);
                    let inviteToken: string | null = null;
                    
                    if (inviteMatch) {
                        inviteToken = inviteMatch[1];
                        console.log('🎫 Found invite token in URL:', inviteToken);
                    } else {
                        // Check for pending invite token from localStorage (survives auth redirect)
                        const pendingToken = localStorage.getItem('pendingInviteToken');
                        if (pendingToken) {
                            inviteToken = pendingToken;
                            console.log('🎫 Found pending invite token from localStorage:', inviteToken);
                            // Clear it so we don't process it again
                            localStorage.removeItem('pendingInviteToken');
                        }
                    }
                    
                    // Handle invite acceptance if we have a token
                    if (inviteToken) {
                        await handleInviteAcceptance(inviteToken, userPerson.id);
                    }
                }
                
                console.log('📊 Fetching user data...');
                const [groupsData, transactionsData, paymentSourcesData, peopleData] = await Promise.all([
                    api.getGroups(userPerson?.id),
                    api.getTransactions(userPerson?.id),
                    api.getPaymentSources(userPerson?.id), // Now filtered by user
                    api.getPeople(userPerson?.id), // Now filtered by user
                ]);
                
                console.log('📈 Data fetched successfully:', {
                    groups: groupsData.length,
                    transactions: transactionsData.length,
                    paymentSources: paymentSourcesData.length,
                    people: peopleData.length
                });
                
                // Detailed logging for groups (helpful for debugging invite issues)
                if (groupsData.length > 0) {
                    console.log('📋 Groups details:', groupsData.map(g => ({
                        id: g.id,
                        name: g.name,
                        memberCount: g.members?.length || 0
                    })));
                } else {
                    console.log('⚠️ No groups found for user:', userPerson?.id);
                }
                
                setGroups(groupsData);
                setTransactions(transactionsData);
                setPaymentSources(paymentSourcesData);
                setPeople(peopleData);
            } catch (error) {
                console.error("❌ Failed to fetch initial data", error);
                alert(`Error loading data: ${error?.message || error}`);
            } finally {
                setIsLoading(false);
            }
        };
        
        // Only fetch data if we have a user
        if (currentUser) {
            fetchData();
        } else {
            console.log('⏳ No current user, skipping data fetch');
            setIsLoading(false);
        }
    }, [currentUser]);

    // Listen for group member additions to refresh data
    useEffect(() => {
        const handleGroupMemberAdded = async (event: CustomEvent) => {
            const { groupId, person } = event.detail;
            console.log('🔄 Group member added, refreshing data...', { groupId, person });
            
            try {
                // Refresh people data to include the new member
                const updatedPeople = await api.getPeople(currentUserPerson?.id);
                setPeople(updatedPeople);
                
                // Refresh groups data to get updated member lists
                const updatedGroups = await api.getGroups(currentUserPerson?.id);
                setGroups(updatedGroups);
                
                console.log('✅ Data refreshed after member addition');
            } catch (error) {
                console.error('❌ Failed to refresh data after member addition:', error);
            }
        };

        window.addEventListener('groupMemberAdded', handleGroupMemberAdded as EventListener);
        
        return () => {
            window.removeEventListener('groupMemberAdded', handleGroupMemberAdded as EventListener);
        };
    }, [currentUserPerson]);

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
                const newGroup = await api.addGroup(groupData, currentUserPerson?.id);
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
            const newSource = await api.addPaymentSource(sourceData, currentUserPerson?.id);
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
        } catch (error) {
            console.error('Failed to archive payment source', error);
        }
    };

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

    const handleViewTransactionDetail = (transaction: Transaction) => {
        setSelectedTransactionForDetail(transaction);
        setIsTransactionDetailOpen(true);
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
                        groups={activeGroups}
                        people={people}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={handleSelectGroup}
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
                        onViewDetails={handleViewTransactionDetail}
                    />
                </>
            ) : (
                <div className="flex-1 flex flex-col">
                    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
                        <h1 className="text-lg font-bold text-white">Kharch Baant</h1>
                        <div className="flex items-center gap-2">
                            <UserMenu />
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
                            currentUserId={currentUserId}
                            onSelectGroup={handleSelectGroup}
                            onAddAction={handleAddActionClick}
                        />
                    </div>
                </div>
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onManagePaymentSources={() => setIsPaymentSourceManageOpen(true)}
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
                    groupBalances={groupBalances}
                    allSettled={allSettled}
                    userSettled={userSettled}
                    isProcessingGroupAction={isProcessingGroupAction}
                    onDeleteGroup={async () => {
                        if (!editingGroup) return;
                        if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
                        setIsProcessingGroupAction(true);
                        try {
                            await deleteGroup(editingGroup.id, currentUserId, editingGroup.createdBy === currentUserId, allSettled);
                            setGroups(prev => prev.filter(g => g.id !== editingGroup.id));
                            setIsGroupModalOpen(false);
                            setSelectedGroupId(null);
                        } catch (e) {
                            alert(e.message || 'Failed to delete group.');
                        } finally {
                            setIsProcessingGroupAction(false);
                        }
                    }}
                    onArchiveGroup={async () => {
                        if (!editingGroup) return;
                        if (!window.confirm('Archive this group? You can find archived groups in App Settings.')) return;
                        setIsProcessingGroupAction(true);
                        try {
                            await archiveGroup(editingGroup.id, currentUserId, editingGroup.createdBy === currentUserId, userSettled, allSettled);
                            setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, isArchived: true } : g));
                            setIsGroupModalOpen(false);
                        } catch (e) {
                            alert(e.message || 'Failed to archive group.');
                        } finally {
                            setIsProcessingGroupAction(false);
                        }
                    }}
                    onOpenPaymentSources={() => {
                        setIsGroupModalOpen(false);
                        setIsPaymentSourceManageOpen(true);
                    }}
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

            {isTransactionDetailOpen && selectedTransactionForDetail && (
                <TransactionDetailModal
                    transaction={selectedTransactionForDetail}
                    onClose={() => {
                        setIsTransactionDetailOpen(false);
                        setSelectedTransactionForDetail(null);
                    }}
                    groupMembers={people.filter(p => selectedGroup?.members.includes(p.id) || false)}
                    paymentSources={paymentSources}
                    onEdit={(transaction) => {
                        setEditingTransaction(transaction);
                        setIsTransactionModalOpen(true);
                        setIsTransactionDetailOpen(false);
                        setSelectedTransactionForDetail(null);
                    }}
                    onDelete={(transaction) => {
                        setPendingDeleteTransaction(transaction);
                        setIsTransactionDetailOpen(false);
                        setSelectedTransactionForDetail(null);
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



            <ApiStatusIndicator />
            <DebugPanel groups={groups} transactions={transactions} />
        </div>
    );
}

// Show sign-in screen when not authenticated
const AppWithAuth: React.FC = () => {
    const { user, loading } = useAuth();
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    
    // Check if there's an invite token in the URL
    const [inviteInfo, setInviteInfo] = useState<{ token: string; groupName?: string } | null>(null);
    
    useEffect(() => {
        const urlPath = window.location.pathname;
        const inviteMatch = urlPath.match(/^\/invite\/(.+)$/);
        
        if (inviteMatch) {
            const token = inviteMatch[1];
            // Store invite token in localStorage so it survives authentication redirect
            localStorage.setItem('pendingInviteToken', token);
            
            // Validate the invite to get group name (for unauthenticated users)
            validateInvite(token).then(validation => {
                if (validation.isValid) {
                    setInviteInfo({
                        token,
                        groupName: validation.group?.name
                    });
                }
            }).catch(console.error);
        }
    }, []);
    
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 max-w-md w-full">
                    {inviteInfo ? (
                        // Invite-specific messaging
                        <>
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">You're Invited!</h1>
                                <p className="text-slate-300 text-lg mb-2">
                                    Join <span className="font-semibold text-blue-400">"{inviteInfo.groupName}"</span>
                                </p>
                                <p className="text-slate-400 text-sm mb-6">
                                    Sign in or create an account to join this group
                                </p>
                            </div>
                            
                            {authMode === 'signin' ? (
                                <SignInForm 
                                    onSwitchToSignUp={() => setAuthMode('signup')}
                                    onSuccess={() => {}}
                                />
                            ) : (
                                <SignUpForm 
                                    onSwitchToSignIn={() => setAuthMode('signin')}
                                    onSuccess={() => {}}
                                />
                            )}
                        </>
                    ) : (
                        // Default sign-in screen
                        <>
                            {authMode === 'signin' ? (
                                <>
                                    <div className="text-center mb-6">
                                        <h1 className="text-3xl font-bold text-white mb-2">Kharch Baant</h1>
                                        <p className="text-slate-300">Track and split expenses with friends</p>
                                    </div>
                                    <SignInForm 
                                        onSwitchToSignUp={() => setAuthMode('signup')}
                                        onSuccess={() => {}}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <h1 className="text-3xl font-bold text-white mb-2">Kharch Baant</h1>
                                        <p className="text-slate-300">Create your account</p>
                                    </div>
                                    <SignUpForm 
                                        onSwitchToSignIn={() => setAuthMode('signin')}
                                        onSuccess={() => setAuthMode('signin')}
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return <App />;
};

export default AppWithAuth;
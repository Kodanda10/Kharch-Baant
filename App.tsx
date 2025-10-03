import React, { useState, useEffect } from 'react';
import { Group, Transaction, Person, PaymentSource } from './types';
import { CURRENT_USER_ID } from './constants';
import * as api from './services/apiService';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import TransactionFormModal from './components/TransactionFormModal';
import GroupFormModal from './components/GroupFormModal';
import HomeScreen from './components/HomeScreen';
import PaymentSourceFormModal from './components/PaymentSourceFormModal';
import ApiStatusIndicator from './components/ApiStatusIndicator';
import DebugPanel from './components/DebugPanel';
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
    const [isPaymentSourceModalOpen, setIsPaymentSourceModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [groupsData, transactionsData, paymentSourcesData, peopleData] = await Promise.all([
                    api.getGroups(),
                    api.getTransactions(),
                    api.getPaymentSources(),
                    api.getPeople(),
                ]);
                setGroups(groupsData);
                setTransactions(transactionsData);
                setPaymentSources(paymentSourcesData);
                setPeople(peopleData);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                // Handle error state in UI
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

    const handleDeleteTransaction = async (id: string) => {
        try {
            await api.deleteTransaction(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete transaction", error);
        }
    };

    const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id' | 'groupId'>) => {
        if (!selectedGroupId && !editingTransaction) return;

        try {
            if (editingTransaction) {
                const updatedTransaction = await api.updateTransaction(editingTransaction.id, transactionData);
                setTransactions(prev => prev.map(t =>
                    t.id === editingTransaction.id ? updatedTransaction : t
                ));
            } else if (selectedGroupId) {
                const newTransaction = await api.addTransaction(selectedGroupId, transactionData);
                setTransactions(prev => [...prev, newTransaction]);
            }
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error("Failed to save transaction", error);
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

    const handleSavePaymentSource = async (sourceData: Omit<PaymentSource, 'id'>) => {
        try {
            const newSource = await api.addPaymentSource(sourceData);
            setPaymentSources(prev => [...prev, newSource]);
            setIsPaymentSourceModalOpen(false);
        } catch(error) {
            console.error("Failed to save payment source", error);
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
                        onAddGroup={handleAddGroupClick}
                        onGoHome={handleGoHome}
                    />
                    <GroupView
                        group={selectedGroup}
                        transactions={groupTransactions}
                        people={people}
                        currentUserId={currentUserId}
                        onAddTransaction={handleAddTransactionClick}
                        onEditTransaction={handleEditTransactionClick}
                        onDeleteTransaction={handleDeleteTransaction}
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
                    onAddGroup={handleAddGroupClick}
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

            <ApiStatusIndicator />
            <DebugPanel groups={groups} transactions={transactions} />
        </div>
    );
};

export default App;
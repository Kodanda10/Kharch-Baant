
import React, { useState } from 'react';
// FIX: Corrected the import path for the types file.
import { Group, Transaction, Person, PaymentSource } from './types';
import { GROUPS, TRANSACTIONS, PEOPLE, CURRENT_USER_ID, PAYMENT_SOURCES } from './constants';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import TransactionFormModal from './components/TransactionFormModal';
import GroupFormModal from './components/GroupFormModal';
import HomeScreen from './components/HomeScreen';
import PaymentSourceFormModal from './components/PaymentSourceFormModal';

const App: React.FC = () => {
    // In a real app, this data would come from an API
    const [groups, setGroups] = useState<Group[]>(GROUPS);
    const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);
    const [people, setPeople] = useState<Person[]>(PEOPLE);
    const [currentUserId] = useState<string>(CURRENT_USER_ID);
    const [paymentSources, setPaymentSources] = useState<PaymentSource[]>(PAYMENT_SOURCES);

    // Start with no group selected to show the HomeScreen
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isPaymentSourceModalOpen, setIsPaymentSourceModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

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

    const handleDeleteTransaction = (id: string) => {
        // Removed window.confirm to make delete immediate and more reliable
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleSaveTransaction = (transactionData: Omit<Transaction, 'id' | 'groupId'>) => {
        if (editingTransaction) {
            // Edit existing
            setTransactions(prev => prev.map(t =>
                t.id === editingTransaction.id ? { ...t, ...transactionData } : t
            ));
        } else if(selectedGroupId) {
            // Add new
            const newTransaction: Transaction = {
                id: `t${Date.now()}`,
                groupId: selectedGroupId,
                ...transactionData,
            };
            setTransactions(prev => [...prev, newTransaction]);
        }
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
    };
    
    const handleAddGroupClick = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleEditGroupClick = () => {
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        if (selectedGroup) {
            setEditingGroup(selectedGroup);
            setIsGroupModalOpen(true);
        }
    };

    const handleSaveGroup = (groupData: Omit<Group, 'id'>) => {
         if (editingGroup) {
            // Edit existing group
            setGroups(prev => prev.map(g => 
                g.id === editingGroup.id ? { ...editingGroup, ...groupData } : g
            ));
        } else {
            // Add new group
            const newGroup: Group = {
                id: `g${Date.now()}`,
                ...groupData,
            };
            setGroups(prev => [...prev, newGroup]);
            setSelectedGroupId(newGroup.id); // Select the new group after creation
        }
        setIsGroupModalOpen(false);
        setEditingGroup(null);
    };

    const handleSavePaymentSource = (sourceData: Omit<PaymentSource, 'id'>) => {
        const newSource: PaymentSource = {
            id: `ps_${Date.now()}`,
            ...sourceData,
        };
        setPaymentSources(prev => [...prev, newSource]);
        setIsPaymentSourceModalOpen(false);
    };

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

        </div>
    );
};

export default App;
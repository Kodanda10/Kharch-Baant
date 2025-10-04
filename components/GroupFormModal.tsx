import React, { useState, useEffect } from 'react';
import { Group, Person, Currency, CURRENCIES, GroupType, GROUP_TYPES } from '../types';
import Avatar from './Avatar';
import { CloseIcon, PlusIcon, ShareIcon, CalendarIcon } from './icons/Icons';
import MemberInviteModal from './MemberInviteModal';
import BaseModal from './BaseModal';

interface GroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: Omit<Group, 'id'>) => void;
    group: Group | null;
    allPeople: Person[];
    currentUserId: string;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSave, group, allPeople, currentUserId }) => {
    const [name, setName] = useState('');
    const [members, setMembers] = useState<string[]>([currentUserId]);
    const [currency, setCurrency] = useState<Currency>('INR');
    const [groupType, setGroupType] = useState<GroupType>('other');
    const [tripStartDate, setTripStartDate] = useState('');
    const [tripEndDate, setTripEndDate] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    // Local copy of people so we can optimistically add newly created person without parent refresh
    const [localPeople, setLocalPeople] = useState<Person[]>(allPeople);

    const requiresTripDates = (type: GroupType) => type === 'trip' || type === 'family_trip';

    useEffect(() => {
        console.log('GroupFormModal useEffect triggered with:', { group, isOpen, currentUserId });
        if (group) {
            console.log('Loading existing group data:', group);
            setName(group.name);
            setMembers(group.members);
            setCurrency(group.currency);
            setGroupType(group.groupType);
            setTripStartDate(group.tripStartDate || '');
            setTripEndDate(group.tripEndDate || '');
        } else {
            console.log('Resetting form for new group');
            setName('');
            setMembers([currentUserId]);
            setCurrency('INR');
            setGroupType('other');
            setTripStartDate('');
            setTripEndDate('');
        }
    }, [group, currentUserId, isOpen]);

    // Keep local people in sync when upstream changes (except when we already added new ones locally)
    useEffect(() => {
        // naive merge by id to preserve any locally added entries
        setLocalPeople(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            for (const p of allPeople) map.set(p.id, p);
            return Array.from(map.values());
        });
    }, [allPeople]);

    const handleGroupTypeChange = (value: GroupType) => {
        setGroupType(value);
        if (!requiresTripDates(value)) {
            setTripStartDate('');
            setTripEndDate('');
        }
    };

    const addMember = (personId: string) => {
        if (!members.includes(personId)) {
            setMembers(prev => [...prev, personId]);
        }
    };
    
    const removeMember = (personId: string) => {
        if (personId === currentUserId) return; // Cannot remove self
        setMembers(prev => prev.filter(id => id !== personId));
    };

    const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();
        console.log('GroupFormModal handleSubmit called with:', { name, members, currency, groupType, tripStartDate, tripEndDate });
        
        if (!name || members.length === 0) {
            console.log('Validation failed: missing name or members');
            return;
        }

        if (requiresTripDates(groupType)) {
            if (!tripStartDate || !tripEndDate) {
                const today = new Date().toISOString().split('T')[0];
                if (!tripStartDate) {
                    console.log('Auto-setting trip start date to today');
                    setTripStartDate(today);
                }
                if (!tripEndDate) {
                    console.log('Auto-setting trip end date to today');  
                    setTripEndDate(today);
                }
                alert('Trip dates were auto-set to today. Please adjust them as needed and save again.');
                return;
            }

            if (new Date(tripStartDate) > new Date(tripEndDate)) {
                alert('Trip start date cannot be after the end date.');
                return;
            }
        }

        const payload: Omit<Group, 'id'> = {
            name,
            members,
            currency,
            groupType,
            tripStartDate: requiresTripDates(groupType) ? tripStartDate : undefined,
            tripEndDate: requiresTripDates(groupType) ? tripEndDate : undefined,
        };

        console.log('Calling onSave with payload:', payload);
        onSave(payload);
        // Don't call onClose() here - let the parent handle it after API success
    };
    
    const handleInvite = () => {
        const shareData = {
            title: 'Join my group on SplitIt!',
            text: `Let's split expenses for "${name || 'our group'}" on SplitIt.`,
            url: window.location.href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert('Invite link copied to clipboard!');
        }
    };

    if (!isOpen) return null;

    const peopleMap = new Map(localPeople.map(p => [p.id, p]));
    const currentMembers = members.map(id => peopleMap.get(id)!).filter(Boolean);
    const availableContacts = localPeople.filter(p => !members.includes(p.id));

    return (
        <>
        <BaseModal
            open={isOpen}
            onClose={onClose}
            title={group ? 'Group Settings' : 'Create Group'}
            size="md"
            description={<span className="text-slate-300 text-sm">Configure group details and manage members.</span>}
            footer={
                <>
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Cancel</button>
                    <button 
                        type="submit" 
                        form="group-form" 
                        className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700"
                    >
                        Save Group
                    </button>
                </>
            }
        >
            <form id="group-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div>
                        <label htmlFor="group-name" className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
                        <input
                            type="text"
                            id="group-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={e => setCurrency(e.target.value as Currency)}
                            className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="group-type" className="block text-sm font-medium text-slate-300 mb-1">Group Type</label>
                        <select
                            id="group-type"
                            value={groupType}
                            onChange={e => handleGroupTypeChange(e.target.value as GroupType)}
                            className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {GROUP_TYPES.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {requiresTripDates(groupType) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="trip-start" className="block text-sm font-medium text-slate-300 mb-1">Trip Start Date</label>
                                <div className="relative">
                                    <input
                                        id="trip-start"
                                        type="date"
                                        value={tripStartDate}
                                        onChange={e => setTripStartDate(e.target.value)}
                                        className="w-full bg-black/30 text-white rounded-md p-2 pr-10 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="trip-end" className="block text-sm font-medium text-slate-300 mb-1">Trip End Date</label>
                                <div className="relative">
                                    <input
                                        id="trip-end"
                                        type="date"
                                        value={tripEndDate}
                                        onChange={e => setTripEndDate(e.target.value)}
                                        className="w-full bg-black/30 text-white rounded-md p-2 pr-10 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                        min={tripStartDate || undefined}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Members Management */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Members</label>
                        
                        {/* Current Members List */}
                        <div className="space-y-2">
                            {currentMembers.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Avatar person={p} size="md" />
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                    {p.id !== currentUserId && (
                                        <button type="button" onClick={() => removeMember(p.id)} className="p-1 text-slate-400 hover:text-white hover:bg-rose-500/50 rounded-full">
                                            <CloseIcon />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <hr className="border-slate-600"/>

                        {/* Invite & Add Section */}
                                                <div className="space-y-3">
                           <button
                                type="button"
                                onClick={handleInvite}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-md hover:bg-emerald-600/40 transition-colors"
                            >
                                <ShareIcon className="h-5 w-5" />
                                <span>Invite with Link</span>
                            </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setShowAddMemberModal(true)}
                                                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-300 rounded-md hover:bg-indigo-600/40 transition-colors"
                                                                                    >
                                                                                        <PlusIcon className="h-5 w-5" />
                                                                                        <span>Add New Member</span>
                                                                                    </button>
                            
                            <h4 className="text-sm font-medium text-slate-400 pt-2">Add from contacts</h4>
                            <div className="space-y-2">
                               {availableContacts.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar person={p} size="md" />
                                            <span className="font-medium">{p.name}</span>
                                        </div>
                                        <button type="button" onClick={() => addMember(p.id)} className="p-1 text-slate-400 hover:text-white hover:bg-indigo-500/50 rounded-full">
                                           <PlusIcon className="h-5 w-5"/>
                                        </button>
                                    </div>
                                ))}
                                {availableContacts.length === 0 && <p className="text-xs text-slate-500 text-center py-2">All your contacts are in this group.</p>}
                            </div>
                        </div>

                    </div>
            </form>
                        </BaseModal>
                                <MemberInviteModal
                                    open={showAddMemberModal}
                                    groupId={group?.id}
                                    existingPeople={localPeople}
                                    onClose={() => setShowAddMemberModal(false)}
                                    onAdded={(person) => {
                                        setLocalPeople(prev => [...prev, person]);
                                        setMembers(prev => prev.includes(person.id) ? prev : [...prev, person.id]);
                                        setShowAddMemberModal(false);
                                    }}
                                />
                        </>
                );
};

export default GroupFormModal;

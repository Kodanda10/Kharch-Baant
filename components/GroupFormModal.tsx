import React, { useState, useEffect, useMemo } from 'react';
import { Group, Person, Currency, CURRENCIES } from '../types';
import Avatar from './Avatar';
import { CloseIcon, PlusIcon, ShareIcon } from './icons/Icons';

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

    useEffect(() => {
        if (group) {
            setName(group.name);
            setMembers(group.members);
            setCurrency(group.currency);
        } else {
            setName('');
            setMembers([currentUserId]);
            setCurrency('INR');
        }
    }, [group, currentUserId, isOpen]);

    const addMember = (personId: string) => {
        if (!members.includes(personId)) {
            setMembers(prev => [...prev, personId]);
        }
    };
    
    const removeMember = (personId: string) => {
        if (personId === currentUserId) return; // Cannot remove self
        setMembers(prev => prev.filter(id => id !== personId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && members.length > 0) {
            onSave({ name, members, currency });
            onClose();
        }
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

    const peopleMap = new Map(allPeople.map(p => [p.id, p]));
    const currentMembers = members.map(id => peopleMap.get(id)!).filter(Boolean);
    const availableContacts = allPeople.filter(p => !members.includes(p.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">{group ? 'Group Settings' : 'Create Group'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
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
                 <div className="flex justify-end gap-4 pt-4 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700">Save Group</button>
                </div>
            </div>
        </div>
    );
};

export default GroupFormModal;
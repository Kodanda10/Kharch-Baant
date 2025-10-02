import React from 'react';
import { Group, Person } from '../types';
import Avatar from './Avatar';

interface GroupListProps {
    groups: Group[];
    people: Person[];
    selectedGroupId: string | null;
    onSelectGroup: (groupId: string) => void;
    onAddGroup: () => void;
    onGoHome: () => void;
}

const GroupListItem: React.FC<{
    group: Group;
    people: Person[];
    isSelected: boolean;
    onSelect: () => void;
}> = ({ group, people, isSelected, onSelect }) => {
    const members = people.filter(p => group.members.includes(p.id));
    
    return (
        <li className="mb-2">
            <button
                onClick={onSelect}
                className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col ${
                    isSelected
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                }`}
            >
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{group.name}</span>
                <div className="flex items-center mt-2 -space-x-2">
                    {members.slice(0, 4).map(member => (
                       <Avatar key={member.id} person={member} size="sm" />
                    ))}
                    {members.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">
                            +{members.length - 4}
                        </div>
                    )}
                </div>
            </button>
        </li>
    );
};


const GroupList: React.FC<GroupListProps> = ({ groups, people, selectedGroupId, onSelectGroup, onAddGroup, onGoHome }) => {
    return (
        <div className="bg-black/20 backdrop-blur-xl border-r border-white/10 text-white w-64 p-4 flex-col hidden md:flex">
            <h1 className="text-2xl font-bold mb-6 cursor-pointer" onClick={onGoHome}>SplitIt</h1>
            <nav className="flex-grow">
                 <button 
                    onClick={onGoHome}
                    className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 mb-4 font-semibold bg-white/5 hover:bg-white/10"
                >
                    <span>Dashboard</span>
                </button>
                <ul>
                    {groups.map(group => (
                        <GroupListItem
                            key={group.id}
                            group={group}
                            people={people}
                            isSelected={selectedGroupId === group.id}
                            onSelect={() => onSelectGroup(group.id)}
                        />
                    ))}
                </ul>
            </nav>
            <button
                onClick={onAddGroup}
                className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4"
            >
                Add New Group
            </button>
        </div>
    );
};

export default GroupList;
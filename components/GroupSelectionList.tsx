import React, { useState, useMemo } from 'react';
import { Group, Person } from '../types';
import Avatar from './Avatar';
import { ChevronRightIcon } from './icons/Icons';

interface GroupSelectionListProps {
  groups: Group[];
  people: Person[];
  onSelectGroup: (groupId: string) => void;
  currentGroupId?: string;
}

const GroupSelectionList: React.FC<GroupSelectionListProps> = ({
  groups,
  people,
  onSelectGroup,
  currentGroupId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Sort groups with current group first, then by name
  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) => {
      if (currentGroupId && a.id === currentGroupId) return -1;
      if (currentGroupId && b.id === currentGroupId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredGroups, currentGroupId]);

  const getGroupMembers = (group: Group) => {
    return group.members.map(memberId => 
      people.find(person => person.id === memberId)
    ).filter(Boolean) as Person[];
  };

  const getGroupTypeLabel = (groupType?: string) => {
    switch (groupType) {
      case 'trip': return '✈️ Trip';
      case 'family_trip': return '👨‍👩‍👧‍👦 Family Trip';
      case 'household': return '🏠 Household';
      case 'friends': return '👥 Friends';
      default: return '📁 General';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {groups.length > 3 && (
        <div>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No groups found matching "{searchQuery}"</p>
          </div>
        ) : (
          sortedGroups.map(group => {
            const members = getGroupMembers(group);
            const isCurrentGroup = currentGroupId === group.id;
            
            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full p-3 rounded-lg transition-colors text-left border ${
                  isCurrentGroup 
                    ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium truncate ${
                        isCurrentGroup ? 'text-indigo-300' : 'text-white'
                      }`}>
                        {group.name}
                      </h3>
                      {isCurrentGroup && (
                        <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{getGroupTypeLabel(group.groupType)}</span>
                      <span>•</span>
                      <span>{group.currency}</span>
                      <span>•</span>
                      <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {/* Member Avatars */}
                    <div className="flex items-center gap-1 mt-2">
                      {members.slice(0, 4).map(member => (
                        <Avatar
                          key={member.id}
                          name={member.name}
                          size="sm"
                          className="ring-1 ring-slate-600"
                        />
                      ))}
                      {members.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRightIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-slate-400">
        Select a group to add your expense to
      </div>
    </div>
  );
};

export default GroupSelectionList;
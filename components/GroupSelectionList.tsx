import React, { useState, useMemo } from 'react';
import { Group, Person } from '../types';
import Avatar from './Avatar';
import { ChevronRightIcon } from './icons/Icons';

interface GroupSelectionListProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  currentGroupId?: string;
}

const GroupSelectionList: React.FC<GroupSelectionListProps> = ({
  groups,
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
            
            
            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full p-3 rounded-lg transition-colors text-left border 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium truncate text-white`}>
                        {group.name}
                      </h3>
                      
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{getGroupTypeLabel(group.groupType)}</span>
                      <span>•</span>
                      <span>{group.currency}</span>
                      <span>•</span>
                      
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
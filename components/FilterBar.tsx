import React from 'react';
import { Person, Filter, SortOption, TAGS } from '../types';
import { CalendarIcon } from './icons/Icons';

interface FilterBarProps {
  filters: Filter;
  onFilterChange: React.Dispatch<React.SetStateAction<Filter>>;
  sortOption: SortOption;
  onSortChange: React.Dispatch<React.SetStateAction<SortOption>>;
  searchQuery: string;
  onSearchChange: React.Dispatch<React.SetStateAction<string>>;
  onDateFilterClick: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  sortOption,
  onSortChange,
  searchQuery,
  onSearchChange,
  onDateFilterClick,
}) => {

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange((prev) => ({ ...prev, tag: e.target.value }));
  };

  return (
    <div className="bg-black/20 p-2 rounded-lg mb-4 flex flex-col md:flex-row gap-2 items-center text-sm">
      <div className="flex-grow w-full md:w-auto">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <select
        value={filters.tag}
        onChange={handleTagChange}
        className="w-full md:w-auto bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Categories</option>
        {TAGS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <button
        onClick={onDateFilterClick}
        className="w-full md:w-auto p-2 bg-black/30 text-white rounded-md border border-slate-600 hover:bg-white/10 flex items-center justify-center gap-2"
      >
        <CalendarIcon className="h-4 w-4" />
        <span>{filters.dateRange ? `${new Date(filters.dateRange.start + 'T00:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${new Date(filters.dateRange.end + 'T00:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` : 'Any Date'}</span>
        {filters.dateRange && (
            <span onClick={(e) => {
                e.stopPropagation();
                onFilterChange(prev => {
                    const { dateRange, ...rest } = prev;
                    return rest;
                })
            }} className="text-xs text-slate-400 hover:text-white">(clear)</span>
        )}
      </button>

      <select
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="w-full md:w-auto bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="date-desc">Date (Newest)</option>
        <option value="date-asc">Date (Oldest)</option>
        <option value="amount-desc">Amount (High-Low)</option>
        <option value="amount-asc">Amount (Low-High)</option>
      </select>
    </div>
  );
};

export default FilterBar;
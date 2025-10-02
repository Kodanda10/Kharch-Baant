import React from 'react';
import { Person, TAGS, Filter, SortOption } from '../types';
import { SortAscIcon, SortDescIcon, CalendarIcon, CloseIcon } from './icons/Icons';

interface FilterBarProps {
    people: Person[];
    filters: Filter;
    onFilterChange: (filters: Filter) => void;
    sortOption: SortOption;
    onSortChange: (sortOption: SortOption) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onDateFilterClick: () => void;
}

const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'date-desc', label: 'Date (Newest)' },
    { value: 'date-asc', label: 'Date (Oldest)' },
    { value: 'amount-desc', label: 'Amount (High-Low)' },
    { value: 'amount-asc', label: 'Amount (Low-High)' },
]

const FilterBar: React.FC<FilterBarProps> = ({ people, filters, onFilterChange, sortOption, onSortChange, searchQuery, onSearchChange, onDateFilterClick }) => {
    const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ ...filters, personId: e.target.value });
    };

    const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ ...filters, tag: e.target.value });
    };

    const handleClearDateFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        const { dateRange, ...rest } = filters;
        onFilterChange(rest);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const dateFilterText = filters.dateRange 
        ? `${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`
        : 'Any date';

    return (
        <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
                 <label htmlFor="search-filter" className="block text-sm font-medium text-slate-400 mb-1">Search</label>
                <input
                    id="search-filter"
                    type="text"
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div className="flex-1 md:flex-none md:w-48 min-w-[150px]">
                <label htmlFor="person-filter" className="block text-sm font-medium text-slate-400 mb-1">Person</label>
                <select id="person-filter" value={filters.personId} onChange={handlePersonChange} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="all">All People</option>
                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="flex-1 md:flex-none md:w-48 min-w-[150px]">
                <label htmlFor="tag-filter" className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                <select id="tag-filter" value={filters.tag} onChange={handleTagChange} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="all">All Categories</option>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex-1 md:flex-none md:w-48 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <button 
                    onClick={onDateFilterClick}
                    className="w-full h-10 bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center justify-between"
                >
                    <span className="truncate">{dateFilterText}</span>
                    {filters.dateRange ? (
                        <span onClick={handleClearDateFilter} className="p-1 rounded-full hover:bg-slate-700">
                            <CloseIcon className="h-4 w-4" />
                        </span>
                    ) : (
                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                    )}
                </button>
            </div>
             <div className="flex-1 md:flex-none md:w-48 min-w-[150px]">
                <label htmlFor="sort-filter" className="block text-sm font-medium text-slate-400 mb-1">Sort by</label>
                <select id="sort-filter" value={sortOption} onChange={(e) => onSortChange(e.target.value as SortOption)} className="w-full bg-black/30 text-white rounded-md p-2 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500">
                    {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
    );
};

export default FilterBar;
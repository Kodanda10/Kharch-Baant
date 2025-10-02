import React, { useState, useEffect } from 'react';
import CalendarModal from './CalendarModal';

interface DateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (range: { start: string; end: string }) => void;
    currentRange?: { start: string; end: string };
}

const DateFilterModal: React.FC<DateFilterModalProps> = ({ isOpen, onClose, onApply, currentRange }) => {
    const today = new Date();
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState<'start' | 'end' | null>(null);

    useEffect(() => {
        if (currentRange) {
            setStartDate(currentRange.start);
            setEndDate(currentRange.end);
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    }, [currentRange, isOpen]);
    
    const handleDateSelect = (date: string) => {
        if (isSelecting === 'start') {
            setStartDate(date);
            if (endDate && new Date(date) > new Date(endDate)) {
                setEndDate(null); // Reset end date if new start date is after it
            }
        } else if (isSelecting === 'end') {
            setEndDate(date);
             if (startDate && new Date(date) < new Date(startDate)) {
                setStartDate(date); // If new end date is before start date, set start date to it
            }
        }
        setIsSelecting(null);
    };
    
    const setThisMonth = () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        onApply({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    const setLast30Days = () => {
        const end = new Date(today);
        const start = new Date();
        start.setDate(today.getDate() - 30);
        onApply({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };
    
    const handleApplyClick = () => {
        if (startDate && endDate) {
            onApply({ start: startDate, end: endDate });
        }
    }

    if (!isOpen) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Select date';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-6">Filter by Date</h2>
                    
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Quick Select</label>
                        <div className="flex gap-4">
                            <button onClick={setThisMonth} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm">This Month</button>
                            <button onClick={setLast30Days} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm">Last 30 Days</button>
                        </div>
                        
                        <hr className="border-slate-700"/>

                        <label className="block text-sm font-medium text-slate-300">Custom Range</label>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                                <button onClick={() => setIsSelecting('start')} className="w-full text-left bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {formatDate(startDate)}
                                </button>
                            </div>
                            <div className="w-full">
                                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                                <button onClick={() => setIsSelecting('end')} className="w-full text-left bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {formatDate(endDate)}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Cancel</button>
                        <button type="button" onClick={handleApplyClick} disabled={!startDate || !endDate} className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Apply Filter</button>
                    </div>
                </div>
            </div>
            {isSelecting && (
                 <CalendarModal 
                    isOpen={!!isSelecting} 
                    onClose={() => setIsSelecting(null)} 
                    selectedDate={(isSelecting === 'start' ? startDate : endDate) || new Date().toISOString().split('T')[0]} 
                    onDateSelect={handleDateSelect} 
                />
            )}
        </>
    );
};

export default DateFilterModal;
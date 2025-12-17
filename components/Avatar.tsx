import React from 'react';
import { Person } from '../types';

interface AvatarProps {
    person?: { id: string; name: string; avatarUrl?: string | null };
    id?: string;
    name?: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
}

const colors = [
    'bg-rose-500', 'bg-amber-500', 'bg-emerald-500',
    'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
];

// Simple hash function to get a consistent color from the person's ID
const getColorForId = (id: string | undefined) => {
    if (typeof id !== 'string' || id.length === 0) {
        return colors[0];
    }
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
    // return colors[0];
};

const getInitials = (name: string | undefined): string => {
    if (typeof name !== 'string' || name.length === 0) {
        return '?';
    }

    // Clean the name and split by spaces
    const cleanName = name.trim();
    const names = cleanName.split(/\s+/).filter(n => n.length > 0);

    if (names.length >= 2) {
        // First name + Last name initials
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    } else if (names.length === 1) {
        // Single name - take first 2 characters or just first if name is short
        const singleName = names[0];
        if (singleName.length >= 2) {
            return singleName.substring(0, 2).toUpperCase();
        } else {
            return singleName.charAt(0).toUpperCase();
        }
    }

    return '?';
};

const Avatar: React.FC<AvatarProps> = ({ person, id, name, avatarUrl, size = 'md' }) => {
    const finalId = person?.id || id;
    const finalName = person?.name || name || '?';
    const finalAvatarUrl = person?.avatarUrl || avatarUrl;

    const sizeClasses = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
    }[size];

    if (finalAvatarUrl && finalAvatarUrl.trim() !== '') {
        return (
            <img
                src={finalAvatarUrl}
                alt={finalName}
                className={`rounded-full object-cover ${sizeClasses}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                    // If image fails to load, hide it and show initials instead
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }

    const color = getColorForId(finalId);
    const initials = getInitials(finalName);

    return (
        <div
            className={`flex items-center justify-center rounded-full font-bold text-white ${color} ${sizeClasses}`}
            title={finalName}
        >
            {initials}
        </div>
    );
};

export default Avatar;

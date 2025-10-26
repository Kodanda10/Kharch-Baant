import React from 'react';
import { Person } from '../types';

interface AvatarProps {
    id?: string;
    name: string;
    avatarUrl?: string;
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
};

const getInitials = (name: string | undefined): string => {
    if (typeof name !== 'string' || name.length === 0) {
        return '?';
    }
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ id, name, avatarUrl, size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
    }[size];

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className={`rounded-full object-cover ${sizeClasses}`}
                referrerPolicy="no-referrer"
            />
        );
    }

    const color = getColorForId(id);
    const initials = getInitials(name);

    return (
        <div
            className={`flex items-center justify-center rounded-full font-bold text-white ${color} ${sizeClasses}`}
            title={name}
        >
            {initials}
        </div>
    );
};

export default Avatar;

import React from 'react';
import { Person } from '../types';

interface AvatarProps {
    person: Person;
    size?: 'sm' | 'md' | 'lg';
}

const colors = [
    'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 
    'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
];

// Simple hash function to get a consistent color from the person's ID
const getColorForId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
};

const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ person, size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
    }[size];

    if (person.avatarUrl) {
        return (
            <img
                src={person.avatarUrl}
                alt={person.name}
                className={`rounded-full object-cover ${sizeClasses}`}
                referrerPolicy="no-referrer"
            />
        );
    }

    const color = getColorForId(person.id);
    const initials = getInitials(person.name);

    return (
        <div
            className={`flex items-center justify-center rounded-full font-bold text-white ${color} ${sizeClasses}`}
            title={person.name}
        >
            {initials}
        </div>
    );
};

export default Avatar;

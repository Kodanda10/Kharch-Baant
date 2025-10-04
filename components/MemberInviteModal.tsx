import React, { useState, useRef, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Person } from '../types';
import { addPersonToGroup, addPerson } from '../services/apiService';

export interface MemberInviteModalProps {
  open: boolean;
  groupId?: string; // optional: if absent we are in group creation mode; person will be created but not yet linked
  existingPeople: Person[]; // global people list (for simple de-dupe by name)
  onClose(): void;
  onAdded(person: Person): void; // bubble newly added person so parent can refresh group members list or staged creation
}

/**
 * MemberInviteModal
 * Lightweight modal to add a new member (Person + group_members link) into a group.
 * Currently supports name (required) & optional email placeholder (not persisted yet; future invites feature).
 * Role always defaults to 'member' (no column in schema yet).
 */
const MemberInviteModal: React.FC<MemberInviteModalProps> = ({ open, groupId, existingPeople, onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // not yet stored; placeholder for future invite flow
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    // Very light duplicate guard (case-insensitive by name)
    const dup = existingPeople.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (dup) {
      if (!confirm('A person with this name already exists. Add anyway?')) return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const person = groupId
        ? await addPersonToGroup(groupId, { name: name.trim() })
        : await addPerson({ name: name.trim(), avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(name.trim())}` });
      onAdded(person);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-md bg-white/10 text-slate-200 hover:bg-white/20 disabled:opacity-50"
        disabled={submitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="member-invite-form"
        className="px-4 py-2 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
        disabled={submitting || !name.trim()}
      >
        {submitting && <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />}
        Add Member
      </button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      title="Add Member"
      size="sm"
      initialFocusRef={inputRef}
      description={<span className="text-sm text-slate-300">Create a new person and add them to this group.</span>}
      footer={footer}
    >
      <form id="member-invite-form" onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Priya"
            className="w-full bg-black/30 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
            data-autofocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="future@optional.invite"
            className="w-full bg-black/30 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-500">Email is not stored yet; reserved for future invitation workflow.</p>
        </div>
        {error && <div className="text-sm text-rose-400 bg-rose-900/30 border border-rose-700/40 rounded-md px-3 py-2">{error}</div>}
        <div className="text-xs text-slate-500 leading-relaxed">
          A Person record is created first, then linked to this group. Roles will arrive later; everyone is a basic member for now.
        </div>
      </form>
    </BaseModal>
  );
};

export default MemberInviteModal;

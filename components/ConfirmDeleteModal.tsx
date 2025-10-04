import React, { useState, useEffect, useCallback } from 'react';
import BaseModal from './BaseModal';

type EntityType = 'transaction' | 'group' | 'paymentSource' | 'member';

export interface ConfirmDeleteModalProps {
  open: boolean;
  entityType: EntityType;
  entityName?: string; // Friendly label e.g. "Paris Trip" or "Lunch at Cafe"
  loading?: boolean; // External loading state (e.g. parent awaiting API)
  impactDescription?: string; // Extra context, e.g. "Balances will recalculate"
  onConfirm(): Promise<void> | void;
  onCancel(): void; // Invoked when user cancels (or close)
}

/**
 * ConfirmDeleteModal
 * Generic destructive-action confirmation modal.
 * - For most entities: simple confirm button.
 * - For groups: requires typing the group name (case insensitive) to enable delete.
 * - Blocks closing via ESC/backdrop while submitting.
 */
const ENTITY_LABEL: Record<EntityType, { title: string; color: string; noun: string }> = {
  transaction: { title: 'Delete Transaction', color: 'text-rose-400', noun: 'transaction' },
  group: { title: 'Delete Group', color: 'text-rose-400', noun: 'group' },
  paymentSource: { title: 'Delete Payment Source', color: 'text-rose-400', noun: 'payment source' },
  member: { title: 'Remove Member', color: 'text-amber-400', noun: 'member' },
};

const destructiveButtonClasses = 'px-4 py-2 bg-gradient-to-br from-rose-600 to-red-600 text-white rounded-md hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed';

const secondaryButtonClasses = 'px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20';

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  entityType,
  entityName,
  loading = false,
  impactDescription,
  onConfirm,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const meta = ENTITY_LABEL[entityType];

  const requiresTyping = entityType === 'group';
  const normalizedTarget = (entityName || '').trim().toLowerCase();
  const normalizedInput = confirmText.trim().toLowerCase();
  const typingSatisfied = !requiresTyping || (normalizedTarget.length > 0 && normalizedInput === normalizedTarget);

  useEffect(() => {
    if (!open) {
      setConfirmText('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting || loading) return;
    if (!typingSatisfied) return;
    try {
      const result = onConfirm();
      if (result && typeof (result as Promise<void>).then === 'function') {
        setIsSubmitting(true);
        await result;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, loading, onConfirm, typingSatisfied]);

  // Prevent closing while submitting
  const beforeClose = (proceed: () => void) => {
    if (isSubmitting || loading) return; // ignore close attempts
    proceed();
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting || loading}
        className={secondaryButtonClasses}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting || loading || !typingSatisfied}
        className={destructiveButtonClasses}
      >
        {isSubmitting || loading ? 'Deleting…' : meta.title.split(' ')[0]}
      </button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      beforeClose={beforeClose}
      title={meta.title}
      size="sm"
      description={<span className="text-slate-300 text-sm">This action cannot be undone.</span>}
      footer={footer}
    >
      <div className="space-y-4 text-sm">
        <p className="text-slate-300">
          Are you sure you want to permanently delete
          {' '}<span className={`${meta.color} font-semibold`}>{entityName ? `“${entityName}”` : `this ${meta.noun}`}</span>?<br />
          This {meta.noun} will be removed and related views will update.
        </p>
        {impactDescription && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-md p-3">
            {impactDescription}
          </div>
        )}
        {requiresTyping && (
          <div className="space-y-2">
            <label htmlFor="confirm-name" className="block text-xs font-medium text-slate-400">
              Type the group name (<span className="text-slate-300 font-semibold">{entityName}</span>) to confirm
            </label>
            <input
              id="confirm-name"
              data-autofocus
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full bg-black/30 text-white rounded-md p-2 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={entityName}
              disabled={isSubmitting || loading}
            />
            {!typingSatisfied && confirmText && (
              <p className="text-xs text-rose-400">Name does not match.</p>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 leading-relaxed">
          Press ESC or click outside to cancel (disabled while processing). All destructive actions should be audited (future enhancement).
        </p>
      </div>
    </BaseModal>
  );
};

export default ConfirmDeleteModal;
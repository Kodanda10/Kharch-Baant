# Missing / Planned Modals

This document captures modal components that are not yet implemented but are recommended to complete the product experience. Each entry includes: Purpose, Core Actions, Suggested Props / Data Contract, Backend Impact (if any), and Implementation Notes.

---
## Priority Tiers
- **P0 (Implement Next)**: Unlocks core financial workflows / prevents data loss
- **P1 (High Value)**: Improves transparency, trust, collaboration
- **P2 (Enhancement)**: Optimization, power-user features, polish

---
## P0 Modals

### 1. SettleUpModal
Record a payment/transfer between members to reduce balances.
- **Purpose**: Allow members to settle debts outside new expense creation.
- **Primary Action**: Create settlement transaction (type: `settlement`).
- **Props**:
  ```ts
  interface SettleUpModalProps {
    open: boolean;
    onClose(): void;
    groupId: string;
    members: Member[]; // from group context
    defaultPayerId?: string;
    defaultReceiverId?: string;
    onCreated(tx: Transaction): void; // optimistic update
  }
  ```
- **Form Fields**: payer, receiver, amount, optional paymentSourceId, date (default today), note.
- **Validation**: payer != receiver, amount > 0.
- **Backend**: Insert transaction row with `type = 'settlement'` and a simple two-member split (negative/positive balances).
- **Edge Cases**: Partial settlement; show remaining balance after creation.

### 2. ConfirmDeleteModal (Generic)
Reusable confirmation for destructive actions.
- **Purpose**: Prevent accidental deletion (transactions, groups, payment sources).
- **Props**:
  ```ts
  interface ConfirmDeleteModalProps {
    open: boolean;
    entityType: 'transaction' | 'group' | 'paymentSource' | 'member';
    entityName?: string; // friendly label
    loading?: boolean;
    onConfirm(): Promise<void> | void;
    onCancel(): void;
    impactDescription?: string; // e.g., "Balances will recalculate"
  }
  ```
- **Implementation**: One component with variant icon & color.
- **UX**: Double-confirm (type name) only for group deletion.

### 3. EditPaymentSourceModal
Modify existing payment source metadata (rename, archive, change last4).
- **Props**:
  ```ts
  interface EditPaymentSourceModalProps {
    open: boolean;
    source: PaymentSource;
    onClose(): void;
    onUpdated(src: PaymentSource): void;
    onArchive?(id: string): Promise<void> | void;
  }
  ```
- **NOTE**: UPI ID optional; allow marking a source as archived (soft delete: `status = 'archived'`).

### 4. MemberInviteModal / AddMemberModal
Add a new participant to a group.
- **Fields**: name, (optional) email, role (default "member").
- **Backend**: Insert into `group_members` (or equivalent).
- **Extras**: Show pending invites if email is used in future.

### 5. ReceiptUploadModal
Attach visual proof to a transaction.
- **Props**:
  ```ts
  interface ReceiptUploadModalProps {
    open: boolean;
    transactionId: string;
    existing?: Receipt[];
    maxFiles?: number; // default 3
    onClose(): void;
    onUploaded(receipts: Receipt[]): void;
  }
  ```
- **Storage**: Supabase storage bucket `receipts/` (folder per transaction).
- **Security**: Restrict access by group membership (RLS policies required).
- **Preview**: show thumbnails; allow delete (with confirm).

### 6. TransactionDetailModal
Read-only (or future inline edit) deep view of a transaction.
- **Displays**: description, amount, date, payer, split breakdown, receipts, audit history.
- **Extension**: Link "Edit" → existing TransactionFormModal in edit mode.

---
## P1 Modals

### 7. OptimizeSettlementsModal
Suggest minimal number of transfers to clear all balances.
- **Logic**: Debt graph simplification (greedy or min-cashflow algorithm).
- **Output**: Proposed settlement list → bulk create settlement transactions.
- **Props**:
  ```ts
  interface OptimizeSettlementsModalProps {
    open: boolean;
    groupId: string;
    balances: Record<MemberId, number>; // positive = owed to them
    onApply(created: Transaction[]): void;
    onClose(): void;
  }
  ```

### 8. AdjustBalanceModal (Admin Only)
Creates an adjustment transaction (type: `adjustment`) to correct legacy or rounding issues.
- **Audit**: Must log reason.

### 9. ArchiveGroupModal
Soft-archives a group (read-only, hidden from active list).

### 10. ExportDataModal
Choose format (CSV / JSON), date range, include receipts toggle.

### 11. SettingsModal
Per-user preferences: currency (if future), date format, default split mode.

### 12. CategoryManagerModal / TagManagerModal
Create / rename / delete custom categories or tags.

---
## P2 Modals

### 13. BulkImportExpensesModal
CSV upload → map columns → preview → commit.

### 14. ActivityLogModal
Filter by member / transaction; paginated audit entries.

### 15. WhatsNewModal
Display release notes (versioned). Show once per version.

### 16. PrivacyNoticeModal / FirstUseModal
One-time acknowledgment around storing only non-sensitive info (payment sources). Already partially implemented via inline warnings—make dismissable.

### 17. ReAuthModal
If token/session expires (future auth integration).

---
## Data / Table Additions (Suggested)
| Concept | Table / Column | Notes |
|---------|----------------|-------|
| Settlement | transactions.type = 'settlement' | Distinguish from 'expense' |
| Adjustment | transactions.type = 'adjustment' | Manual admin corrections |
| Archived payment sources | payment_sources.status | enum('active','archived') |
| Receipts | receipts (id, transaction_id, path, uploaded_by, created_at) | FK w/ RLS |
| Categories | categories (id, group_id?, name, color) | Optional group scope |
| Tags | tags (id, group_id?, name); transaction_tags (tx_id, tag_id) | M:N |
| Audit | audit_log (id, entity_type, entity_id, actor_id, action, diff, created_at) | JSON diff |

---
## Reusable Primitive: `BaseModal`
Create a shared component to standardize layout & accessibility.
```tsx
interface BaseModalProps {
  open: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose(): void;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean };
  secondaryActions?: { label: string; onClick: () => void; variant?: 'secondary'|'danger' }[];
  children: React.ReactNode;
  footerContent?: React.ReactNode; // optional custom footer override
}
```

---
## Implementation Order Recommendation
1. BaseModal (foundation)
2. SettleUpModal
3. ConfirmDeleteModal (generic)
4. TransactionDetailModal
5. ReceiptUploadModal
6. EditPaymentSourceModal + archive flag
7. OptimizeSettlementsModal
8. MemberInviteModal
9. AdjustBalanceModal
10. ExportDataModal

---
## Sample Wireframe Descriptions
- **SettleUpModal**: Two member selectors (payer, receiver), amount input, optional payment source dropdown, date picker, note textarea, live preview of resulting balances.
- **ReceiptUploadModal**: Drag & drop zone, thumbnails grid (with remove), upload progress bars, attach & close.
- **TransactionDetailModal**: Left: core fields; Right: split breakdown + receipts; Footer: actions (Edit, Settle Up, View History).

---
## Validation & Edge Cases
| Modal | Edge Cases |
|-------|------------|
| SettleUp | Amount exceeds current debt (warn but allow partial); same payer/receiver (block) |
| ReceiptUpload | File too large / unsupported type; duplicate file names |
| OptimizeSettlements | Zero-sum already; extremely unbalanced single debtor/creditor (still handle) |
| AdjustBalance | Must require non-empty reason; show resulting balance delta preview |
| DeleteConfirm | If deleting group with outstanding unsettled balances—warn prominently |

---
## Security / Privacy Notes
- Never store full card numbers, CVV, or full UPI IDs (already enforced) — reiterate in PaymentSource modals.
- Apply RLS policies to `receipts` and `audit_log` tables.
- Audit every destructive action (`delete`, `archive`, `adjustment`).

---
## Testing Strategy (Outline)
| Modal | Key Tests |
|-------|-----------|
| SettleUp | Creates settlement, updates balances, prevents invalid payer=receiver |
| ConfirmDelete | Calls onConfirm once, handles loading state, ESC closes only when not loading |
| ReceiptUpload | Rejects > maxFiles, preserves previous uploads on failure |
| OptimizeSettlements | Generates minimal transfer set for known scenarios |
| TransactionDetail | Renders splits accurately, links to edit, shows receipts |

---
## Future Extensibility
- Add multi-currency support with per-line local currency & fxRate fields.
- Collaborative editing (websocket presence) in TransactionDetailModal.
- AI-assisted receipt parsing (amount + participants) pipeline.

---
## Quick Stub Example (SettleUpModal)
```tsx
// components/SettleUpModal.tsx
import React from 'react';
import { BaseModal } from './BaseModal'; // to be created
import { Member, Transaction } from '../types';

interface SettleUpModalProps {
  open: boolean;
  onClose(): void;
  groupId: string;
  members: Member[];
  onCreated(tx: Transaction): void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({ open, onClose, groupId, members, onCreated }) => {
  // state: payerId, receiverId, amount, date, note, paymentSourceId
  // handlers: validate, submit -> call supabase RPC or insert transaction
  return (
    <BaseModal
      open={open}
      title="Settle Up"
      primaryAction={{ label: 'Record', onClick: () => {/* submit */} }}
      onClose={onClose}
    >
      {/* form fields go here */}
      <div className="space-y-3 text-sm">
        <p className="text-slate-400">Record a direct payment between members to reduce outstanding balances.</p>
      </div>
    </BaseModal>
  );
};
```

---
**Maintainer Note**: Keep this file updated as modals are implemented—add a Status column or strike-through completed ones.

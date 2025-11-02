import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type ModalName =
  | 'transactionForm'
  | 'transactionDetail'
  | 'groupForm'
  | 'shareModal'
  | 'memberInvite'
  | 'archivedGroups'
  | 'archivePrompt'
  | 'paymentSourceForm'
  | 'paymentSourceManage'
  | 'settleUp'
  | 'balanceBreakdown'
  | 'calendar'
  | 'dateFilter'
  | 'addAction'
  | 'settings'

interface UIState {
  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void

  openModals: Partial<Record<ModalName, boolean>>
  openModal: (name: ModalName) => void
  closeModal: (name: ModalName) => void
}

export const useAppStore = create<UIState>()(
  devtools((set) => ({
    selectedGroupId: null,
    setSelectedGroupId: (id) => set({ selectedGroupId: id }),

    openModals: {},
    openModal: (name) => set((s) => ({ openModals: { ...s.openModals, [name]: true } })),
    closeModal: (name) => set((s) => ({ openModals: { ...s.openModals, [name]: false } })),
  }), { name: 'app-ui' })
)

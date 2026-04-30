import { create } from 'zustand'

export type OverlayId = 'commandPalette' | 'profileEditor' | 'sessionHistory' | 'taskBoard'

type OverlayState = {
  stack: OverlayId[]
  isOpen(id: OverlayId): boolean
  zIndex(id: OverlayId): number
  open(id: OverlayId): void
  close(id: OverlayId): void
  closeTop(): void
  closeAll(): void
  bringToTop(id: OverlayId): void
}

const BASE_Z_INDEX = 1000
const Z_INDEX_STEP = 10

export const useOverlayStore = create<OverlayState>((set, get) => ({
  stack: [],

  isOpen(id) {
    return get().stack.includes(id)
  },

  zIndex(id) {
    const index = get().stack.indexOf(id)
    return index >= 0 ? BASE_Z_INDEX + index * Z_INDEX_STEP : 0
  },

  open(id) {
    const { stack } = get()
    if (stack.includes(id)) {
      get().bringToTop(id)
      return
    }
    set({ stack: [...stack, id] })
  },

  close(id) {
    set((state) => ({ stack: state.stack.filter((item) => item !== id) }))
  },

  closeTop() {
    const { stack } = get()
    if (stack.length > 0) {
      set({ stack: stack.slice(0, -1) })
    }
  },

  closeAll() {
    set({ stack: [] })
  },

  bringToTop(id) {
    set((state) => {
      if (!state.stack.includes(id)) return state
      return { stack: [...state.stack.filter((item) => item !== id), id] }
    })
  }
}))

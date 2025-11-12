import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCampusStore = create(
  persist(
    (set) => ({
      selectedCampus: null,
      setCampus: (campus) => set({ selectedCampus: campus }),
    }),
    {
      name: 'campus-storage',
    }
  )
)


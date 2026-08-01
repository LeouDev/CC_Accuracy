import { create } from "zustand";
import type { FilterState } from "@/types/domain";

interface FilterStore extends FilterState {
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  reset: () => void;
}

const initial: FilterState = {
  site: [],
  supervisor: [],
  technician: [],
  auditor: [],
  category: [],
  subcategory: [],
  month: [],
  quarter: [],
  year: [],
  dateFrom: null,
  dateTo: null,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initial,
  setFilter: (key, value) => set({ [key]: value } as Partial<FilterStore>),
  reset: () => set(initial),
}));

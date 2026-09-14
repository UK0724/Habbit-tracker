import { useAuthStore } from "../../../stores/authStore";
import { create } from "zustand";
import {
  getDsaProfile,
  markProblemSolved,
  unmarkProblemSolved,
  getDsaProblems,
  getDsaProblemDetail,
  SolvedProblem,
  DsaProblem
} from "../services/dsaPrepApi";

interface DsaPrepState {
  solvedProblems: SolvedProblem[];
  problems: DsaProblem[];
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchProblems: () => Promise<void>;
  fetchProblemDetail: (id: number) => Promise<DsaProblem | null>;
  solveProblem: (problemId: number, language: string, notes?: string) => Promise<void>;
  unsolveProblem: (problemId: number) => Promise<void>;
  clearData: () => void;
}

export const useDsaPrepStore = create<DsaPrepState>((set, get) => ({
  solvedProblems: [],
  problems: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getDsaProfile();
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to load DSA Profile", isLoading: false });
    }
  },

  fetchProblems: async () => {
    // Return early if already loaded
    if (get().problems.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const data = await getDsaProblems();
      set({ problems: data || [], isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to load DSA problems catalog", isLoading: false });
    }
  },

  fetchProblemDetail: async (id) => {
    // Check cache first
    const cached = get().problems.find(p => p.id === id);
    if (cached) return cached;
    try {
      const data = await getDsaProblemDetail(id);
      return data || null;
    } catch (err) {
      console.error(`Failed to fetch problem detail for Q${id}:`, err);
      return null;
    }
  },

  solveProblem: async (problemId, language, notes) => {
    set({ isLoading: true, error: null });
    try {
      const data = await markProblemSolved({ problemId, language, notes });
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to mark problem solved", isLoading: false });
      throw err;
    }
  },

  unsolveProblem: async (problemId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await unmarkProblemSolved({ problemId });
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to unmark problem solved", isLoading: false });
      throw err;
    }
  },

  clearData: () => {
    set({ solvedProblems: [], problems: [], error: null, isLoading: false });
  }
}));

useAuthStore.subscribe((state,previous)=>{if(state.token!==previous.token) {  useDsaPrepStore.setState(useDsaPrepStore.getInitialState(),true); }});

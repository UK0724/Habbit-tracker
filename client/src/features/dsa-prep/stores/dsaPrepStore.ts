import { create } from "zustand";
import { getDsaProfile, markProblemSolved, unmarkProblemSolved, SolvedProblem } from "../services/dsaPrepApi";

interface DsaPrepState {
  solvedProblems: SolvedProblem[];
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  solveProblem: (problemId: number, language: string, notes?: string) => Promise<void>;
  unsolveProblem: (problemId: number) => Promise<void>;
  clearData: () => void;
}

export const useDsaPrepStore = create<DsaPrepState>((set) => ({
  solvedProblems: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getDsaProfile();
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || "Failed to load DSA Profile", isLoading: false });
    }
  },

  solveProblem: async (problemId, language, notes) => {
    set({ isLoading: true, error: null });
    try {
      const data = await markProblemSolved({ problemId, language, notes });
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || "Failed to mark problem solved", isLoading: false });
      throw err;
    }
  },

  unsolveProblem: async (problemId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await unmarkProblemSolved({ problemId });
      set({ solvedProblems: data?.solvedProblems || [], isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || "Failed to unmark problem solved", isLoading: false });
      throw err;
    }
  },

  clearData: () => {
    set({ solvedProblems: [], error: null, isLoading: false });
  }
}));

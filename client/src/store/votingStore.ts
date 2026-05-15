import { create } from 'zustand';
import type { Candidate, VotingStats } from '../types';

interface VotingState {
  candidates: Candidate[];
  results: VotingStats | null;
  selectedCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  setCandidates: (candidates: Candidate[]) => void;
  setResults: (results: VotingStats | null) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateCandidateVotes: (candidateId: string, newCount: number) => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  candidates: [],
  results: null,
  selectedCandidate: null,
  isLoading: false,
  error: null,

  setCandidates: (candidates) => set({ candidates }),

  setResults: (results) => set({ results }),

  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateCandidateVotes: (candidateId: string, newCount: number) =>
    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.id === candidateId ? { ...c, vote_count: newCount } : c
      ),
    })),
}));
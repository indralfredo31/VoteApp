import apiClient from './apiClient';
import type {
  Candidate,
  VotingStats,
  VoteRequest,
  ApiResponse,
} from '../types';

export const votingApi = {
  // Get all candidates
  getCandidates: async (): Promise<ApiResponse<Candidate[]>> => {
    const response = await apiClient.get<ApiResponse<Candidate[]>>('/voting/candidates');
    return response.data;
  },

  // Submit vote
  submitVote: async (data: VoteRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/voting/submit', data);
    return response.data;
  },

  // Get voting results
  getResults: async (): Promise<ApiResponse<VotingStats>> => {
    const response = await apiClient.get<ApiResponse<VotingStats>>('/voting/results');
    return response.data;
  },

  // Get voting status (open/closed)
  getStatus: async (): Promise<ApiResponse<{
    isOpen: boolean;
    votingEnabled: boolean;
    openAt: string | null;
    closeAt: string | null;
    message: string;
  }>> => {
    const response = await apiClient.get('/voting/status');
    return response.data;
  },
};
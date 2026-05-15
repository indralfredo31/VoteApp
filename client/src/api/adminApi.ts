import apiClient from './apiClient';
import type {
  Candidate,
  VotingSettings,
  CandidateFormData,
  ApiResponse,
} from '../types';

export const adminApi = {
  // Get all candidates
  getCandidates: async (): Promise<ApiResponse<Candidate[]>> => {
    const response = await apiClient.get<ApiResponse<Candidate[]>>('/admin/candidates');
    return response.data;
  },

  // Add candidate
  addCandidate: async (data: CandidateFormData): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('nomor_urut', String(data.nomor_urut));
    formData.append('nama_ketua', data.nama_ketua);
    formData.append('prodi_ketua', data.prodi_ketua);
    formData.append('nama_wakil', data.nama_wakil);
    formData.append('prodi_wakil', data.prodi_wakil);
    formData.append('visi', data.visi);
    formData.append('misi', data.misi);
    if (data.foto_ketua) formData.append('foto_ketua', data.foto_ketua);
    if (data.foto_wakil) formData.append('foto_wakil', data.foto_wakil);

    const response = await apiClient.post<ApiResponse>('/admin/candidates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Edit candidate
  editCandidate: async (id: number, data: CandidateFormData): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('nomor_urut', String(data.nomor_urut));
    formData.append('nama_ketua', data.nama_ketua);
    formData.append('prodi_ketua', data.prodi_ketua);
    formData.append('nama_wakil', data.nama_wakil);
    formData.append('prodi_wakil', data.prodi_wakil);
    formData.append('visi', data.visi);
    formData.append('misi', data.misi);
    if (data.foto_ketua) formData.append('foto_ketua', data.foto_ketua);
    if (data.foto_wakil) formData.append('foto_wakil', data.foto_wakil);

    const response = await apiClient.put<ApiResponse>(`/admin/candidates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete candidate
  deleteCandidate: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/admin/candidates/${id}`);
    return response.data;
  },

  // Get settings
  getSettings: async (): Promise<ApiResponse<VotingSettings>> => {
    const response = await apiClient.get<ApiResponse<VotingSettings>>('/admin/settings');
    return response.data;
  },

  // Update settings
  updateSettings: async (data: Partial<VotingSettings>): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/admin/settings', data);
    return response.data;
  },

  // Get voting stats
  getStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    totalVoted: number;
    totalCandidates: number;
  }>> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Reset voting
  resetVoting: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/admin/reset', { confirm: 'yes' });
    return response.data;
  },

  // Export results as Excel
  exportResults: async (): Promise<Blob> => {
    const response = await apiClient.get('/admin/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import voters from CSV
  importVoters: async (file: File): Promise<ApiResponse<{ successCount: number; errorCount: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/import-voters', formData);
    return response.data;
  },

  // Get voters list
  getVoters: async (): Promise<ApiResponse<{ users: any[]; total: number; voted: number }>> => {
    const response = await apiClient.get('/admin/voters');
    return response.data;
  },

  // Delete voter
  deleteVoter: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/voters/${id}`);
    return response.data;
  },
};
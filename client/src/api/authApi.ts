import apiClient from './apiClient';
import type {
  User,
  LoginRequest,
  AdminLoginRequest,
  ApiResponse,
} from '../types';

export const authApi = {
  // User login
  login: async (data: LoginRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/login', data);
    return response.data;
  },

  // User logout
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Get current user
  me: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  // Admin login
  adminLogin: async (data: AdminLoginRequest): Promise<ApiResponse<{ username: string }>> => {
    const response = await apiClient.post<ApiResponse<{ username: string }>>('/auth/admin-login', data);
    return response.data;
  },

  // Admin logout
  adminLogout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/admin-logout');
    return response.data;
  },
};
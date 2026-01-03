import api from './api';
import {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User
} from '../types';

export const authService = {
  // Register a new user
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: { name?: string; phone?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }
};

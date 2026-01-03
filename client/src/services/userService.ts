import api from './api';
import { ApiResponse, User, PaginationParams } from '../types';

export const userService = {
  // Get all users (Admin)
  getUsers: async (params?: PaginationParams & { role?: string; isActive?: boolean }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user (Admin)
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user (Admin)
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (Admin)
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Deactivate user (Admin)
  deactivateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}/deactivate`);
    return response.data;
  },

  // Activate user (Admin)
  activateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}/activate`);
    return response.data;
  },

  // Get user statistics (Admin)
  getUserStats: async () => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  }
};

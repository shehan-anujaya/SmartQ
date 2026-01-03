import api from './api';
import { ApiResponse, Service, PaginationParams } from '../types';

export const serviceService = {
  // Get all services
  getServices: async (params?: PaginationParams & { status?: string; category?: string }) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  // Get single service
  getService: async (id: string): Promise<ApiResponse<Service>> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Create service
  createService: async (data: Partial<Service>): Promise<ApiResponse<Service>> => {
    const response = await api.post('/services', data);
    return response.data;
  },

  // Update service
  updateService: async (id: string, data: Partial<Service>): Promise<ApiResponse<Service>> => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  // Delete service
  deleteService: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Get service categories
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/services/categories/list');
    return response.data;
  }
};

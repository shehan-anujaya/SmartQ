import api from './api';
import { ApiResponse, Queue, QueueStats, PaginationParams } from '../types';

export const queueService = {
  // Get all queues (Admin/Staff)
  getQueues: async (params?: PaginationParams & { status?: string }) => {
    const response = await api.get('/queues', { params });
    return response.data;
  },

  // Get my queues (Customer)
  getMyQueues: async (): Promise<ApiResponse<Queue[]>> => {
    const response = await api.get('/queues/my-queues');
    return response.data;
  },

  // Get single queue
  getQueue: async (id: string): Promise<ApiResponse<Queue>> => {
    const response = await api.get(`/queues/${id}`);
    return response.data;
  },

  // Join queue
  joinQueue: async (data: { service: string; priority?: number; notes?: string }): Promise<ApiResponse<Queue>> => {
    const response = await api.post('/queues', data);
    return response.data;
  },

  // Update queue status (Admin/Staff)
  updateQueueStatus: async (id: string, status: string): Promise<ApiResponse<Queue>> => {
    const response = await api.put(`/queues/${id}/status`, { status });
    return response.data;
  },

  // Cancel queue
  cancelQueue: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/queues/${id}`);
    return response.data;
  },

  // Get queue statistics (Admin/Staff)
  getQueueStats: async (): Promise<ApiResponse<QueueStats>> => {
    const response = await api.get('/queues/stats/overview');
    return response.data;
  }
};

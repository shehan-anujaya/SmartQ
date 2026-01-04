import api from './api';
import { ApiResponse } from '../types';

export interface PeakHourData {
  hour: number;
  dayOfWeek: number;
  expectedLoad: number;
  recommendation: string;
}

export interface WaitTimeEstimate {
  estimatedWaitMinutes: number;
  queuePosition: number;
  confidence: number;
}

export interface OptimalSlot {
  date: string;
  time: string;
  score: number;
  reason: string;
}

export interface AIHealthStatus {
  status: string;
  services: {
    peakHoursPrediction: string;
    waitTimeEstimation: string;
    optimalSlotRecommendation: string;
  };
  timestamp: string;
}

export const aiService = {
  // Get peak hours predictions
  getPeakHours: async (serviceId?: string): Promise<ApiResponse<PeakHourData[]>> => {
    const params = serviceId ? { serviceId } : {};
    const response = await api.get('/ai/peak-hours', { params });
    return response.data;
  },

  // Get wait time estimate
  getWaitTimeEstimate: async (serviceId: string): Promise<ApiResponse<WaitTimeEstimate>> => {
    const response = await api.get(`/ai/wait-time/${serviceId}`);
    return response.data;
  },

  // Get optimal booking slots
  getOptimalSlots: async (serviceId: string, date: string): Promise<ApiResponse<OptimalSlot[]>> => {
    const response = await api.get('/ai/optimal-slots', {
      params: { serviceId, date }
    });
    return response.data;
  },

  // Get AI health status
  getHealthCheck: async (): Promise<ApiResponse<AIHealthStatus>> => {
    const response = await api.get('/ai/health');
    return response.data;
  }
};

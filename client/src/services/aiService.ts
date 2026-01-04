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
    patternAnalysis: string;
    queueEfficiency: string;
  };
  timestamp: string;
}

export interface AppointmentPatterns {
  totalAppointments: number;
  byStatus: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byHour: Record<number, number>;
  byService: Record<string, number>;
  averageLeadTime: number;
  cancelationRate: number;
  noShowRate: number;
}

export interface QueueEfficiency {
  totalCompleted: number;
  averageWaitTime: number;
  averageServiceTime: number;
  byService: Record<string, { count: number; avgWait: number; avgService: number }>;
  peakHours: { hour: number; count: number }[];
  recommendations: string[];
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
  },

  // Analyze appointment patterns
  analyzeAppointmentPatterns: async (days: number = 30): Promise<ApiResponse<AppointmentPatterns>> => {
    try {
      const response = await api.get(`/ai/analytics/appointments?days=${days}`);
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: {
          totalAppointments: 0,
          byStatus: {},
          byDayOfWeek: {},
          byHour: {},
          byService: {},
          averageLeadTime: 0,
          cancelationRate: 0,
          noShowRate: 0
        }
      };
    }
  },

  // Analyze queue efficiency
  analyzeQueueEfficiency: async (days: number = 30): Promise<ApiResponse<QueueEfficiency>> => {
    try {
      const response = await api.get(`/ai/analytics/queue-efficiency?days=${days}`);
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: {
          totalCompleted: 0,
          averageWaitTime: 0,
          averageServiceTime: 0,
          byService: {},
          peakHours: [],
          recommendations: []
        }
      };
    }
  }
};

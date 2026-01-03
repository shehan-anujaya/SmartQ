import api from './api';
import { ApiResponse, Appointment, AppointmentStats, PaginationParams } from '../types';

export const appointmentService = {
  // Get all appointments (Admin/Staff)
  getAppointments: async (params?: PaginationParams & { status?: string; date?: string }) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Get my appointments (Customer)
  getMyAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
    const response = await api.get('/appointments/my-appointments');
    return response.data;
  },

  // Get single appointment
  getAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Create appointment
  createAppointment: async (data: {
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    notes?: string;
  }): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id: string, data: Partial<Appointment>): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },

  // Update appointment status (Admin/Staff)
  updateAppointmentStatus: async (id: string, status: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  // Get appointment statistics (Admin/Staff)
  getAppointmentStats: async (): Promise<ApiResponse<AppointmentStats>> => {
    const response = await api.get('/appointments/stats/overview');
    return response.data;
  }
};

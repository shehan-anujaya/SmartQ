import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AppointmentState, Appointment } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import toast from 'react-hot-toast';

const initialState: AppointmentState = {
  appointments: [],
  myAppointments: [],
  currentAppointment: null,
  loading: false,
  error: null,
  pagination: null,
  stats: null
};

// Get all appointments (Admin/Staff)
export const getAppointments = createAsyncThunk(
  'appointments/getAppointments',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointments(params);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch appointments';
      return rejectWithValue(message);
    }
  }
);

// Get my appointments (Customer)
export const getMyAppointments = createAsyncThunk(
  'appointments/getMyAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getMyAppointments();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch appointments';
      return rejectWithValue(message);
    }
  }
);

// Get single appointment
export const getAppointment = createAsyncThunk(
  'appointments/getAppointment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointment(id);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch appointment';
      return rejectWithValue(message);
    }
  }
);

// Create appointment
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (
    data: {
      service: string;
      appointmentDate: string;
      appointmentTime: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await appointmentService.createAppointment(data);
      toast.success('Appointment created successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update appointment
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, data }: { id: string; data: Partial<Appointment> }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.updateAppointment(id, data);
      toast.success('Appointment updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update appointment status (Admin/Staff)
export const updateAppointmentStatus = createAsyncThunk(
  'appointments/updateAppointmentStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.updateAppointmentStatus(id, status);
      toast.success('Appointment status updated!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Cancel appointment
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (id: string, { rejectWithValue }) => {
    try {
      await appointmentService.cancelAppointment(id);
      toast.success('Appointment cancelled successfully!');
      return id;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to cancel appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Get appointment statistics (Admin/Staff)
export const getAppointmentStats = createAsyncThunk(
  'appointments/getAppointmentStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointmentStats();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch statistics';
      return rejectWithValue(message);
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get all appointments
    builder
      .addCase(getAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.appointments;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get my appointments
    builder
      .addCase(getMyAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.myAppointments = action.payload;
        }
      })
      .addCase(getMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get single appointment
    builder
      .addCase(getAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentAppointment = action.payload;
        }
      })
      .addCase(getAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create appointment
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.myAppointments.unshift(action.payload);
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update appointment
    builder
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.appointments.findIndex(a => a._id === action.payload!._id);
          if (index !== -1) {
            state.appointments[index] = action.payload;
          }
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update appointment status
    builder
      .addCase(updateAppointmentStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.appointments.findIndex(a => a._id === action.payload!._id);
          if (index !== -1) {
            state.appointments[index] = action.payload;
          }
        }
      })
      .addCase(updateAppointmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel appointment
    builder
      .addCase(cancelAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.myAppointments = state.myAppointments.filter(a => a._id !== action.payload);
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get appointment stats
    builder
      .addCase(getAppointmentStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAppointmentStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload ?? null;
      })
      .addCase(getAppointmentStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentAppointment, clearError } = appointmentSlice.actions;
export default appointmentSlice.reducer;

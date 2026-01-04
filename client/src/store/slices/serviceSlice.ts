import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ServiceState, Service } from '../../types';
import { serviceService } from '../../services/serviceService';
import toast from 'react-hot-toast';

const initialState: ServiceState = {
  services: [],
  currentService: null,
  loading: false,
  error: null,
  pagination: null
};

// Get all services
export const getServices = createAsyncThunk(
  'services/getServices',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await serviceService.getServices(params);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch services';
      return rejectWithValue(message);
    }
  }
);

// Get single service
export const getService = createAsyncThunk(
  'services/getService',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await serviceService.getService(id);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch service';
      return rejectWithValue(message);
    }
  }
);

// Create service
export const createService = createAsyncThunk(
  'services/createService',
  async (data: Partial<Service>, { rejectWithValue }) => {
    try {
      const response = await serviceService.createService(data);
      toast.success('Service created successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update service
export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ id, data }: { id: string; data: Partial<Service> }, { rejectWithValue }) => {
    try {
      const response = await serviceService.updateService(id, data);
      toast.success('Service updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Delete service
export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id: string, { rejectWithValue }) => {
    try {
      await serviceService.deleteService(id);
      toast.success('Service deleted successfully!');
      return id;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    clearCurrentService: (state) => {
      state.currentService = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get all services
    builder
      .addCase(getServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getServices.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both direct array and nested object response
        if (action.payload?.data?.services) {
          state.services = action.payload.data.services;
          state.pagination = action.payload.data.pagination;
        } else if (Array.isArray(action.payload?.data)) {
          state.services = action.payload.data;
        } else if (action.payload?.services) {
          state.services = action.payload.services;
          state.pagination = action.payload.pagination;
        } else if (Array.isArray(action.payload)) {
          state.services = action.payload;
        }
      })
      .addCase(getServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get single service
    builder
      .addCase(getService.pending, (state) => {
        state.loading = true;
      })
      .addCase(getService.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentService = action.payload;
        }
      })
      .addCase(getService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create service
    builder
      .addCase(createService.pending, (state) => {
        state.loading = true;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.services.unshift(action.payload);
        }
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update service
    builder
      .addCase(updateService.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.services.findIndex(s => s._id === action.payload!._id);
          if (index !== -1) {
            state.services[index] = action.payload;
          }
          if (state.currentService?._id === action.payload._id) {
            state.currentService = action.payload;
          }
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete service
    builder
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.services = state.services.filter(s => s._id !== action.payload);
        }
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentService, clearError } = serviceSlice.actions;
export default serviceSlice.reducer;

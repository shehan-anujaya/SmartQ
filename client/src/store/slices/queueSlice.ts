import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { QueueState } from '../../types';
import { queueService } from '../../services/queueService';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';

const initialState: QueueState = {
  queues: [],
  myQueues: [],
  currentQueue: null,
  loading: false,
  error: null,
  pagination: null,
  stats: null
};

// Get all queues (Admin/Staff)
export const getQueues = createAsyncThunk(
  'queues/getQueues',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await queueService.getQueues(params);
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

// Get my queues (Customer)
export const getMyQueues = createAsyncThunk(
  'queues/getMyQueues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await queueService.getMyQueues();
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

// Get single queue
export const getQueue = createAsyncThunk(
  'queues/getQueue',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await queueService.getQueue(id);
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

// Join queue
export const joinQueue = createAsyncThunk(
  'queues/joinQueue',
  async (data: { service: string; priority?: number; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await queueService.joinQueue(data);
      toast.success('Successfully joined queue!');
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update queue status (Admin/Staff)
export const updateQueueStatus = createAsyncThunk(
  'queues/updateQueueStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await queueService.updateQueueStatus(id, status);
      toast.success('Queue status updated!');
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Cancel queue
export const cancelQueue = createAsyncThunk(
  'queues/cancelQueue',
  async (id: string, { rejectWithValue }) => {
    try {
      await queueService.cancelQueue(id);
      toast.success('Queue cancelled successfully!');
      return id;
    } catch (error: any) {
      const message = getErrorMessage(error);
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Get queue statistics (Admin/Staff)
export const getQueueStats = createAsyncThunk(
  'queues/getQueueStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await queueService.getQueueStats();
      return response as any;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

const queueSlice = createSlice({
  name: 'queues',
  initialState,
  reducers: {
    clearCurrentQueue: (state) => {
      state.currentQueue = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get all queues
    builder
      .addCase(getQueues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQueues.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload?.data?.queues) {
          state.queues = payload.data.queues;
          state.pagination = payload.data.pagination || null;
        } else if (payload?.queues) {
          state.queues = payload.queues;
          state.pagination = payload.pagination || null;
        } else if (Array.isArray(payload?.data)) {
          state.queues = payload.data;
        } else if (Array.isArray(payload)) {
          state.queues = payload;
        }
      })
      .addCase(getQueues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get my queues
    builder
      .addCase(getMyQueues.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyQueues.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (Array.isArray(payload?.data)) {
          state.myQueues = payload.data;
        } else if (Array.isArray(payload)) {
          state.myQueues = payload;
        } else {
          state.myQueues = [];
        }
      })
      .addCase(getMyQueues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get single queue
    builder
      .addCase(getQueue.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQueue.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.currentQueue = payload?.data || payload || null;
      })
      .addCase(getQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Join queue
    builder
      .addCase(joinQueue.pending, (state) => {
        state.loading = true;
      })
      .addCase(joinQueue.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const queue = payload?.data || payload;
        if (queue) {
          state.myQueues.unshift(queue);
        }
      })
      .addCase(joinQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update queue status
    builder
      .addCase(updateQueueStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQueueStatus.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const updatedQueue = payload?.data || payload;
        if (updatedQueue) {
          const index = state.queues.findIndex(q => q._id === updatedQueue._id);
          if (index !== -1) {
            state.queues[index] = updatedQueue;
          }
        }
      })
      .addCase(updateQueueStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel queue
    builder
      .addCase(cancelQueue.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelQueue.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.myQueues = state.myQueues.filter(q => q._id !== action.payload);
          state.queues = state.queues.filter(q => q._id !== action.payload);
        }
      })
      .addCase(cancelQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get queue stats
    builder
      .addCase(getQueueStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQueueStats.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.stats = payload?.data || payload || null;
      })
      .addCase(getQueueStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentQueue, clearError } = queueSlice.actions;
export default queueSlice.reducer;

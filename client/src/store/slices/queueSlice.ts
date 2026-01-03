import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { QueueState, Queue } from '../../types';
import { queueService } from '../../services/queueService';
import toast from 'react-hot-toast';

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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch queues';
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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch queues';
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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch queue';
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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to join queue';
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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update queue';
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
      const message = error.response?.data?.error || 'Failed to cancel queue';
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
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch statistics';
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
        state.queues = action.payload.queues;
        state.pagination = action.payload.pagination;
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
      .addCase(getMyQueues.fulfilled, (state, action: PayloadAction<Queue[]>) => {
        state.loading = false;
        state.myQueues = action.payload;
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
      .addCase(getQueue.fulfilled, (state, action: PayloadAction<Queue>) => {
        state.loading = false;
        state.currentQueue = action.payload;
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
      .addCase(joinQueue.fulfilled, (state, action: PayloadAction<Queue>) => {
        state.loading = false;
        state.myQueues.unshift(action.payload);
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
      .addCase(updateQueueStatus.fulfilled, (state, action: PayloadAction<Queue>) => {
        state.loading = false;
        const index = state.queues.findIndex(q => q._id === action.payload._id);
        if (index !== -1) {
          state.queues[index] = action.payload;
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
      .addCase(cancelQueue.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.myQueues = state.myQueues.filter(q => q._id !== action.payload);
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
        state.stats = action.payload;
      })
      .addCase(getQueueStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentQueue, clearError } = queueSlice.actions;
export default queueSlice.reducer;

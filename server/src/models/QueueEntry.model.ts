import mongoose, { Schema } from 'mongoose';
import { IQueueEntry, QueueEntryStatus } from '../types';

const queueEntrySchema = new Schema<IQueueEntry>(
  {
    queue: {
      type: Schema.Types.ObjectId,
      ref: 'Queue',
      required: [true, 'Queue reference is required']
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required']
    },
    counter: {
      type: Schema.Types.ObjectId,
      ref: 'Counter'
    },
    entryNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(QueueEntryStatus),
      default: QueueEntryStatus.WAITING
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    estimatedWaitTime: {
      type: Number,
      default: 0
    },
    actualWaitTime: {
      type: Number
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    calledAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
queueEntrySchema.index({ queue: 1, status: 1 });
queueEntrySchema.index({ customer: 1, status: 1 });
queueEntrySchema.index({ counter: 1, status: 1 });
queueEntrySchema.index({ entryNumber: 1 });
queueEntrySchema.index({ joinedAt: 1 });

// Auto-increment entry number per queue
queueEntrySchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastEntry = await mongoose.model('QueueEntry')
        .findOne({ queue: this.queue })
        .sort({ entryNumber: -1 });
      this.entryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model<IQueueEntry>('QueueEntry', queueEntrySchema);

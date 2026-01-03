import mongoose, { Schema } from 'mongoose';
import { IQueue, QueueStatus } from '../types';

const queueSchema = new Schema<IQueue>(
  {
    name: {
      type: String,
      required: [true, 'Queue name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required']
    },
    date: {
      type: Date,
      required: [true, 'Queue date is required'],
      default: Date.now
    },
    status: {
      type: String,
      enum: Object.values(QueueStatus),
      default: QueueStatus.ACTIVE
    },
    maxCapacity: {
      type: Number,
      default: 100
    },
    currentCount: {
      type: Number,
      default: 0
    },
    averageWaitTime: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
queueSchema.index({ service: 1, date: 1 });
queueSchema.index({ status: 1 });
queueSchema.index({ date: 1 });

// Virtual for queue entries
queueSchema.virtual('entries', {
  ref: 'QueueEntry',
  localField: '_id',
  foreignField: 'queue'
});

export default mongoose.model<IQueue>('Queue', queueSchema);

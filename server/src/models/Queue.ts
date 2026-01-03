import mongoose, { Schema } from 'mongoose';
import { IQueue, QueueStatus } from '../types';

const queueSchema = new Schema<IQueue>(
  {
    queueNumber: {
      type: Number,
      required: true,
      unique: true
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
    status: {
      type: String,
      enum: Object.values(QueueStatus),
      default: QueueStatus.WAITING
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    estimatedTime: {
      type: Date,
      required: true
    },
    actualStartTime: {
      type: Date
    },
    actualEndTime: {
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

// Indexes for better query performance
queueSchema.index({ status: 1, createdAt: -1 });
queueSchema.index({ customer: 1, status: 1 });
queueSchema.index({ queueNumber: 1 });

// Auto-increment queue number
queueSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastQueue = await mongoose.model('Queue').findOne().sort({ queueNumber: -1 });
      this.queueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model<IQueue>('Queue', queueSchema);

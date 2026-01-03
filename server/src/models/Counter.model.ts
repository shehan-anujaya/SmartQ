import mongoose, { Schema } from 'mongoose';
import { ICounter } from '../types';

const counterSchema = new Schema<ICounter>(
  {
    counterNumber: {
      type: Number,
      required: [true, 'Counter number is required'],
      unique: true,
      min: [1, 'Counter number must be at least 1']
    },
    name: {
      type: String,
      required: [true, 'Counter name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    services: [{
      type: Schema.Types.ObjectId,
      ref: 'Service'
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'break'],
      default: 'active'
    },
    currentQueue: {
      type: Schema.Types.ObjectId,
      ref: 'Queue'
    },
    staffAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    averageServiceTime: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
counterSchema.index({ status: 1 });
counterSchema.index({ counterNumber: 1 });

export default mongoose.model<ICounter>('Counter', counterSchema);

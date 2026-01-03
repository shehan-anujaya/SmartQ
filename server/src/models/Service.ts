import mongoose, { Schema } from 'mongoose';
import { IService, ServiceStatus } from '../types';

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Service name must be at least 3 characters'],
      maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes']
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(ServiceStatus),
      default: ServiceStatus.ACTIVE
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
serviceSchema.index({ status: 1, category: 1 });

export default mongoose.model<IService>('Service', serviceSchema);

import mongoose, { Schema } from 'mongoose';
import { ICounter, CounterStatus } from '../types';

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
      maxlength: [100, 'Counter name cannot exceed 100 characters']
    },
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
      }
    ],
    status: {
      type: String,
      enum: Object.values(CounterStatus),
      default: CounterStatus.AVAILABLE
    },
    currentQueue: {
      type: Schema.Types.ObjectId,
      ref: 'Queue',
      default: null
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
counterSchema.index({ status: 1 });
counterSchema.index({ assignedStaff: 1 });
counterSchema.index({ services: 1 });

// Validate that assigned staff has staff or admin role
counterSchema.pre('save', async function (next) {
  if (this.assignedStaff && this.isModified('assignedStaff')) {
    const User = mongoose.model('User');
    const staff = await User.findById(this.assignedStaff);
    
    if (staff && staff.role === 'customer') {
      throw new Error('Only staff or admin can be assigned to a counter');
    }
  }
  next();
});

export default mongoose.model<ICounter>('Counter', counterSchema);

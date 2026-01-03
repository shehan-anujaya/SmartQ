import mongoose, { Schema } from 'mongoose';
import { IAppointment, AppointmentStatus } from '../types';

const appointmentSchema = new Schema<IAppointment>(
  {
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
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      validate: {
        validator: function(date: Date) {
          return date >= new Date();
        },
        message: 'Appointment date cannot be in the past'
      }
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    staffAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
appointmentSchema.index({ customer: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Prevent double booking
appointmentSchema.index(
  { customer: 1, appointmentDate: 1, appointmentTime: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] }
    }
  }
);

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);

import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Service Types
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IService extends Document {
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Queue Types
export enum QueueStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface IQueue extends Document {
  queueNumber: number;
  customer: IUser['_id'];
  service: IService['_id'];
  counter?: ICounter['_id'];
  status: QueueStatus;
  priority: number;
  estimatedTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Types
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface IAppointment extends Document {
  customer: IUser['_id'];
  service: IService['_id'];
  appointmentDate: Date;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  staffAssigned?: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

// Auth Request
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Counter Types
export enum CounterStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface ICounter extends Document {
  counterNumber: number;
  name: string;
  services: IService['_id'][];
  status: CounterStatus;
  currentQueue?: IQueue['_id'];
  assignedStaff?: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

// Queue Entry (enhanced queue with counter assignment)
export interface IQueueEntry extends Document {
  queueNumber: number;
  customer: IUser['_id'];
  service: IService['_id'];
  counter?: ICounter['_id'];
  status: QueueStatus;
  priority: number;
  estimatedTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  waitTimeMinutes?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Prediction Types
export interface IPeakHourPrediction {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  predictedVolume: number;
  confidence: number; // 0-1
}

export interface IWaitTimeEstimate {
  estimatedWaitMinutes: number;
  queuePosition: number;
  totalAhead: number;
  averageServiceTime: number;
  confidence: number; // 0-1
}

export interface IAIAnalysisResult {
  peakHours?: IPeakHourPrediction[];
  waitTimeEstimate?: IWaitTimeEstimate;
  timestamp: Date;
}

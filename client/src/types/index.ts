// User Types
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer'
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

// Service Types
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceState {
  services: Service[];
  currentService: Service | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
}

// Queue Types
export enum QueueStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface Queue {
  _id: string;
  queueNumber: number;
  customer: User;
  service: Service;
  status: QueueStatus;
  priority: number;
  estimatedTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueState {
  queues: Queue[];
  myQueues: Queue[];
  currentQueue: Queue | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  stats: QueueStats | null;
}

export interface QueueStats {
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  total: number;
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

export interface Appointment {
  _id: string;
  customer: User;
  service: Service;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  staffAssigned?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentState {
  appointments: Appointment[];
  myAppointments: Appointment[];
  currentAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  stats: AppointmentStats | null;
}

export interface AppointmentStats {
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

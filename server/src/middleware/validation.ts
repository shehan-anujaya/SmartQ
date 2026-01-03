import { body, param, query, ValidationChain } from 'express-validator';
import { UserRole, ServiceStatus, QueueStatus, AppointmentStatus } from '../types';

// User Validation
export const registerValidation = (): ValidationChain[] => [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(Object.values(UserRole)).withMessage('Invalid role')
];

export const loginValidation = (): ValidationChain[] => [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Service Validation
export const serviceValidation = (): ValidationChain[] => [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 5, max: 480 }).withMessage('Duration must be 5-480 minutes'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('status')
    .optional()
    .isIn(Object.values(ServiceStatus)).withMessage('Invalid status')
];

// Queue Validation
export const queueValidation = (): ValidationChain[] => [
  body('service')
    .notEmpty().withMessage('Service is required')
    .isMongoId().withMessage('Invalid service ID'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Priority must be 0-10'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

export const updateQueueStatusValidation = (): ValidationChain[] => [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(QueueStatus)).withMessage('Invalid status')
];

// Appointment Validation
export const appointmentValidation = (): ValidationChain[] => [
  body('service')
    .notEmpty().withMessage('Service is required')
    .isMongoId().withMessage('Invalid service ID'),
  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('appointmentTime')
    .notEmpty().withMessage('Appointment time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

export const updateAppointmentStatusValidation = (): ValidationChain[] => [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(AppointmentStatus)).withMessage('Invalid status')
];

// ID Validation
export const idValidation = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid ID format')
];

// Query Validation
export const paginationValidation = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
];

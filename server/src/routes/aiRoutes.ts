import express from 'express';
import {
  getPeakHoursPrediction,
  getWaitTimeEstimate,
  getAIAnalysis,
  getOptimalSlots,
  getAIHealthCheck
} from '../controllers/aiController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/health', getAIHealthCheck);
router.get('/wait-time/:serviceId', getWaitTimeEstimate);

// Protected routes (all authenticated users)
router.get('/optimal-slots', protect, getOptimalSlots);

// Admin/Staff only routes
router.get('/peak-hours', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getPeakHoursPrediction);
router.get('/analysis', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getAIAnalysis);

export default router;

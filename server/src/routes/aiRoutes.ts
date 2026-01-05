import express from 'express';
import {
  getPeakHoursPrediction,
  getWaitTimeEstimate,
  getAIAnalysis,
  getOptimalSlots,
  getAIHealthCheck,
  analyzeAppointmentPatterns,
  analyzeQueueEfficiency,
  getAIInsights,
  getSmartWaitTime,
  getPersonalizedRecommendations
} from '../controllers/aiController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/health', getAIHealthCheck);
router.get('/wait-time/:serviceId', getWaitTimeEstimate);
router.get('/smart-wait-time/:serviceId', getSmartWaitTime); // Real AI

// Protected routes (all authenticated users)
router.get('/optimal-slots', protect, getOptimalSlots);
router.get('/recommendations', protect, getPersonalizedRecommendations); // Real AI

// Admin/Staff only routes
router.get('/peak-hours', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getPeakHoursPrediction);
router.get('/analysis', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getAIAnalysis);
router.get('/insights', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getAIInsights); // Real AI
router.get('/analytics/appointments', protect, authorize(UserRole.ADMIN, UserRole.STAFF), analyzeAppointmentPatterns);
router.get('/analytics/queue-efficiency', protect, authorize(UserRole.ADMIN, UserRole.STAFF), analyzeQueueEfficiency);

export default router;

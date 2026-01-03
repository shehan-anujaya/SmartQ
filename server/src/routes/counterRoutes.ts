import express from 'express';
import {
  getCounters,
  getCounter,
  createCounter,
  updateCounter,
  deleteCounter,
  assignQueueToCounter,
  completeQueueAtCounter,
  getCounterStats
} from '../controllers/counterController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Statistics route (must be before /:id)
router.get('/stats/overview', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getCounterStats);

// Public/General routes
router.get('/', protect, authorize(UserRole.ADMIN, UserRole.STAFF), getCounters);
router.get('/:id', protect, getCounter);

// Admin only routes
router.post('/', protect, authorize(UserRole.ADMIN), createCounter);
router.put('/:id', protect, authorize(UserRole.ADMIN), updateCounter);
router.delete('/:id', protect, authorize(UserRole.ADMIN), deleteCounter);

// Staff/Admin routes for queue management
router.put(
  '/:id/assign-queue',
  protect,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  assignQueueToCounter
);
router.put(
  '/:id/complete-queue',
  protect,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  completeQueueAtCounter
);

export default router;

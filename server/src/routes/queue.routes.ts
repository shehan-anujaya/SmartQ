import { Router } from 'express';
import {
  getQueues,
  getQueue,
  createQueue,
  updateQueue,
  deleteQueue,
  updateQueueStatus,
  getQueueAnalytics
} from '../controllers/queue.controller';
import { protect, authorize } from '../middleware/auth';
import {
  queueValidation,
  idValidation,
  paginationValidation,
  dateRangeValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin/Staff routes
router.get(
  '/',
  authorize('admin', 'staff'),
  [...paginationValidation(), ...dateRangeValidation()],
  validateRequest,
  getQueues
);

router.get(
  '/:id',
  idValidation(),
  validateRequest,
  getQueue
);

router.get(
  '/:id/analytics',
  authorize('admin', 'staff'),
  idValidation(),
  validateRequest,
  getQueueAnalytics
);

router.post(
  '/',
  authorize('admin', 'staff'),
  queueValidation(),
  validateRequest,
  createQueue
);

router.put(
  '/:id',
  authorize('admin', 'staff'),
  [...idValidation(), ...queueValidation()],
  validateRequest,
  updateQueue
);

router.patch(
  '/:id/status',
  authorize('admin', 'staff'),
  idValidation(),
  validateRequest,
  updateQueueStatus
);

router.delete(
  '/:id',
  authorize('admin'),
  idValidation(),
  validateRequest,
  deleteQueue
);

export default router;

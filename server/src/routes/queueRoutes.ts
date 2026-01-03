import express from 'express';
import {
  getQueues,
  getMyQueues,
  getQueue,
  joinQueue,
  updateQueueStatus,
  cancelQueue,
  getQueueStats
} from '../controllers/queueController';
import { protect, authorize } from '../middleware/auth';
import {
  queueValidation,
  updateQueueStatusValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.get('/my-queues', getMyQueues);
router.post('/', queueValidation(), validateRequest, joinQueue);

// Admin/Staff routes
router.get(
  '/',
  authorize('admin', 'staff'),
  paginationValidation(),
  validateRequest,
  getQueues
);
router.get('/stats/overview', authorize('admin', 'staff'), getQueueStats);
router.get('/:id', idValidation(), validateRequest, getQueue);

router.put(
  '/:id/status',
  authorize('admin', 'staff'),
  idValidation(),
  updateQueueStatusValidation(),
  validateRequest,
  updateQueueStatus
);

router.delete('/:id', idValidation(), validateRequest, cancelQueue);

export default router;

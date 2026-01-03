import { Router } from 'express';
import {
  getCounters,
  getCounter,
  createCounter,
  updateCounter,
  deleteCounter,
  updateCounterStatus,
  getCounterStats
} from '../controllers/counter.controller';
import { protect, authorize } from '../middleware/auth';
import {
  counterValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = Router();

// All routes require authentication
router.use(protect);

// Public to authenticated users
router.get('/', paginationValidation(), validateRequest, getCounters);
router.get('/:id', idValidation(), validateRequest, getCounter);

// Admin/Staff only
router.get(
  '/:id/stats',
  authorize('admin', 'staff'),
  idValidation(),
  validateRequest,
  getCounterStats
);

router.patch(
  '/:id/status',
  authorize('admin', 'staff'),
  idValidation(),
  validateRequest,
  updateCounterStatus
);

// Admin only
router.post(
  '/',
  authorize('admin'),
  counterValidation(),
  validateRequest,
  createCounter
);

router.put(
  '/:id',
  authorize('admin'),
  [...idValidation(), ...counterValidation()],
  validateRequest,
  updateCounter
);

router.delete(
  '/:id',
  authorize('admin'),
  idValidation(),
  validateRequest,
  deleteCounter
);

export default router;

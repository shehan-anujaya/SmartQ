import { Router } from 'express';
import {
  getQueueEntries,
  getMyQueueEntries,
  getQueueEntry,
  joinQueue,
  updateQueueEntryStatus,
  cancelQueueEntry
} from '../controllers/queueEntry.controller';
import { protect, authorize } from '../middleware/auth';
import {
  queueEntryValidation,
  updateQueueEntryStatusValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.get('/my', getMyQueueEntries);
router.post('/', queueEntryValidation(), validateRequest, joinQueue);

// Shared routes
router.get('/:id', idValidation(), validateRequest, getQueueEntry);
router.delete('/:id', idValidation(), validateRequest, cancelQueueEntry);

// Admin/Staff routes
router.get(
  '/',
  authorize('admin', 'staff'),
  paginationValidation(),
  validateRequest,
  getQueueEntries
);

router.put(
  '/:id/status',
  authorize('admin', 'staff'),
  [...idValidation(), ...updateQueueEntryStatusValidation()],
  validateRequest,
  updateQueueEntryStatus
);

export default router;

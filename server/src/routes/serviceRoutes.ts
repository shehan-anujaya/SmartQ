import express from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getCategories
} from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';
import {
  serviceValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = express.Router();

// Public routes
router.get('/', paginationValidation(), validateRequest, getServices);
router.get('/categories/list', getCategories);
router.get('/:id', idValidation(), validateRequest, getService);

// Protected routes (Admin/Staff)
router.post(
  '/',
  protect,
  authorize('admin', 'staff'),
  serviceValidation(),
  validateRequest,
  createService
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'staff'),
  idValidation(),
  validateRequest,
  updateService
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  idValidation(),
  validateRequest,
  deleteService
);

export default router;

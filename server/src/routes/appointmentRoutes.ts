import express from 'express';
import {
  getAppointments,
  getMyAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentStats
} from '../controllers/appointmentController';
import { protect, authorize } from '../middleware/auth';
import {
  appointmentValidation,
  updateAppointmentStatusValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.get('/my-appointments', getMyAppointments);
router.post('/', appointmentValidation(), validateRequest, createAppointment);

// Admin/Staff routes
router.get(
  '/',
  authorize('admin', 'staff'),
  paginationValidation(),
  validateRequest,
  getAppointments
);
router.get('/stats/overview', authorize('admin', 'staff'), getAppointmentStats);
router.get('/:id', idValidation(), validateRequest, getAppointment);
router.put('/:id', idValidation(), validateRequest, updateAppointment);

router.put(
  '/:id/status',
  authorize('admin', 'staff'),
  idValidation(),
  updateAppointmentStatusValidation(),
  validateRequest,
  updateAppointmentStatus
);

router.delete('/:id', idValidation(), validateRequest, cancelAppointment);

export default router;

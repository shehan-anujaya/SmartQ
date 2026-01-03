import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserStats
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { idValidation, paginationValidation } from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', paginationValidation(), validateRequest, getUsers);
router.get('/stats/overview', getUserStats);
router.get('/:id', idValidation(), validateRequest, getUser);
router.put('/:id', idValidation(), validateRequest, updateUser);
router.delete('/:id', idValidation(), validateRequest, deleteUser);
router.put('/:id/deactivate', idValidation(), validateRequest, deactivateUser);
router.put('/:id/activate', idValidation(), validateRequest, activateUser);

export default router;

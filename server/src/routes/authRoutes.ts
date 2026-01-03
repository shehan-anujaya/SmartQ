import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import {
  registerValidation,
  loginValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = express.Router();

// Public routes
router.post('/register', registerValidation(), validateRequest, register);
router.post('/login', loginValidation(), validateRequest, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;

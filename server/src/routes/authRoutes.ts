import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  refreshAccessToken,
  logout
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
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;

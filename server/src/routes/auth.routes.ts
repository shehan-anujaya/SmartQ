import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation
} from '../middleware/validation';
import { validateRequest } from '../utils/validateRequest';

const router = Router();

// Public routes
router.post('/register', registerValidation(), validateRequest, register);
router.post('/login', loginValidation(), validateRequest, login);
router.post('/refresh', refreshTokenValidation(), validateRequest, refreshToken);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

export default router;

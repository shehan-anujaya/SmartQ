import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

export const generateToken = (userId: string, role: UserRole): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId, role }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

export const verifyToken = (token: string): { userId: string; role: UserRole } => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as { userId: string; role: UserRole };
};

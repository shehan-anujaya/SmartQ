import * as jwt from 'jsonwebtoken';
import { UserRole } from '../types';

// Generate access token (short-lived)
export const generateAccessToken = (userId: string, role: UserRole): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || '15m'; // 15 minutes

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId, role }, jwtSecret as jwt.Secret, {
    expiresIn: jwtExpire
  } as jwt.SignOptions);
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d'; // 7 days

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign({ userId }, refreshSecret as jwt.Secret, {
    expiresIn: refreshExpire
  } as jwt.SignOptions);
};

// Legacy function for backward compatibility
export const generateToken = (userId: string, role: UserRole): string => {
  return generateAccessToken(userId, role);
};

// Verify access token
export const verifyToken = (token: string): { userId: string; role: UserRole } => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as { userId: string; role: UserRole };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, refreshSecret) as { userId: string };
};

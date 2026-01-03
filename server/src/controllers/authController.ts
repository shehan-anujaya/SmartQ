import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest, ApiResponse } from '../types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      } as ApiResponse);
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer'
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        accessToken,
        refreshToken
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration'
    } as ApiResponse);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator'
      } as ApiResponse);
      return;
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        accessToken,
        refreshToken
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during login'
    } as ApiResponse);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.userId).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      } as ApiResponse);
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      } as ApiResponse);
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      } as ApiResponse);
      return;
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    if (user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      } as ApiResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      } as ApiResponse);
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    // Clear refresh token
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

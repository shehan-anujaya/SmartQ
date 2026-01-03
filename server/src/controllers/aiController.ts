import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import {
  predictPeakHours,
  estimateWaitTime,
  performAIAnalysis,
  getOptimalBookingSlots
} from '../services/aiService';

// @desc    Get peak hours prediction
// @route   GET /api/ai/peak-hours
// @access  Private (Admin/Staff)
export const getPeakHoursPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    // Validate days parameter
    if (days < 1 || days > 365) {
      res.status(400).json({
        success: false,
        error: 'Days parameter must be between 1 and 365'
      } as ApiResponse);
      return;
    }

    const predictions = await predictPeakHours(days);

    res.status(200).json({
      success: true,
      data: {
        predictions,
        analyzedDays: days,
        generatedAt: new Date()
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating peak hours prediction'
    } as ApiResponse);
  }
};

// @desc    Estimate wait time for service
// @route   GET /api/ai/wait-time/:serviceId
// @access  Public
export const getWaitTimeEstimate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const queueSize = parseInt(req.query.queueSize as string) || 0;

    // Validate queue size
    if (queueSize < 0) {
      res.status(400).json({
        success: false,
        error: 'Queue size must be a non-negative number'
      } as ApiResponse);
      return;
    }

    const estimate = await estimateWaitTime(serviceId, queueSize);

    res.status(200).json({
      success: true,
      data: estimate
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error estimating wait time'
    } as ApiResponse);
  }
};

// @desc    Get comprehensive AI analysis
// @route   GET /api/ai/analysis
// @access  Private (Admin/Staff)
export const getAIAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceId = req.query.serviceId as string;
    const queueSize = req.query.queueSize ? parseInt(req.query.queueSize as string) : undefined;

    const analysis = await performAIAnalysis(serviceId, queueSize);

    res.status(200).json({
      success: true,
      data: analysis
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error performing AI analysis'
    } as ApiResponse);
  }
};

// @desc    Get optimal booking time slots
// @route   GET /api/ai/optimal-slots
// @access  Private
export const getOptimalSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dayOfWeek = parseInt(req.query.dayOfWeek as string);

    // Validate day of week
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({
        success: false,
        error: 'dayOfWeek must be a number between 0 (Sunday) and 6 (Saturday)'
      } as ApiResponse);
      return;
    }

    // Parse exclude hours if provided
    let excludeHours: number[] = [];
    if (req.query.excludeHours) {
      try {
        excludeHours = JSON.parse(req.query.excludeHours as string);
        if (!Array.isArray(excludeHours)) {
          throw new Error('excludeHours must be an array');
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid excludeHours format. Must be a JSON array of numbers.'
        } as ApiResponse);
        return;
      }
    }

    const slots = await getOptimalBookingSlots(dayOfWeek, excludeHours);

    // Map day number to day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.status(200).json({
      success: true,
      data: {
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        recommendations: slots,
        generatedAt: new Date()
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting optimal booking slots'
    } as ApiResponse);
  }
};

// @desc    Get AI service health check
// @route   GET /api/ai/health
// @access  Public
export const getAIHealthCheck = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        status: 'operational',
        services: {
          peakHoursPrediction: 'available',
          waitTimeEstimation: 'available',
          optimalSlotRecommendation: 'available'
        },
        timestamp: new Date()
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'AI service health check failed'
    } as ApiResponse);
  }
};

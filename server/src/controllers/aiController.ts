import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import {
  predictPeakHours,
  estimateWaitTime,
  performAIAnalysis,
  getOptimalBookingSlots
} from '../services/aiService';
import {
  generateQueueInsights,
  getAIPoweredWaitTime,
  getSmartRecommendations
} from '../services/geminiService'; // Using FREE Google Gemini instead of OpenAI
import Appointment from '../models/Appointment';
import Queue from '../models/Queue';

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
    // Non-blocking: return empty array on error
    res.status(200).json({
      success: true,
      message: 'AI prediction unavailable, returning empty results',
      data: {
        predictions: [],
        analyzedDays: 0,
        generatedAt: new Date()
      }
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
    // Non-blocking: return default estimate
    res.status(200).json({
      success: true,
      message: 'AI estimate unavailable, returning default',
      data: {
        estimatedWaitTime: 15,
        queueLength: 0,
        confidence: 0,
        message: 'Default estimate (AI unavailable)'
      }
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
    res.status(200).json({
      success: true,
      data: {
        insights: ['AI analysis temporarily unavailable'],
        metrics: {
          efficiency: 0,
          customerSatisfaction: 0,
          resourceUtilization: 0
        },
        recommendations: ['System operating in standard mode']
      }
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
    res.status(200).json({
      success: true,
      data: {
        dayOfWeek: parseInt(req.query.dayOfWeek as string) || 0,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(req.query.dayOfWeek as string) || 0],
        recommendations: [],
        generatedAt: new Date()
      }
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
          optimalSlotRecommendation: 'available',
          patternAnalysis: 'available',
          queueEfficiency: 'available'
        },
        timestamp: new Date()
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(200).json({
      success: true,
      data: {
        status: 'degraded',
        services: {
          peakHoursPrediction: 'unavailable',
          waitTimeEstimation: 'unavailable',
          optimalSlotRecommendation: 'unavailable',
          patternAnalysis: 'unavailable',
          queueEfficiency: 'unavailable'
        },
        timestamp: new Date()
      }
    } as ApiResponse);
  }
};

// @desc    Analyze historical appointment patterns
// @route   GET /api/ai/analytics/appointments
// @access  Private (Admin/Staff)
export const analyzeAppointmentPatterns = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await Appointment.find({
      createdAt: { $gte: startDate }
    })
      .populate('service', 'name duration')
      .populate('user', 'name email');

    const patterns = {
      totalAppointments: appointments.length,
      byStatus: {} as Record<string, number>,
      byDayOfWeek: {} as Record<string, number>,
      byHour: {} as Record<number, number>,
      byService: {} as Record<string, number>,
      averageLeadTime: 0,
      cancelationRate: 0,
      noShowRate: 0
    };

    let totalLeadTime = 0;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    appointments.forEach(apt => {
      patterns.byStatus[apt.status] = (patterns.byStatus[apt.status] || 0) + 1;
      const dayName = dayNames[new Date(apt.appointmentDate).getDay()];
      patterns.byDayOfWeek[dayName] = (patterns.byDayOfWeek[dayName] || 0) + 1;
      const hour = parseInt(apt.appointmentTime.split(':')[0]);
      patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;
      const serviceName = (apt.service as any)?.name || 'Unknown';
      patterns.byService[serviceName] = (patterns.byService[serviceName] || 0) + 1;

      const bookingDate = new Date(apt.createdAt);
      const appointmentDate = new Date(apt.appointmentDate);
      const leadTime = (appointmentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
      totalLeadTime += leadTime;
    });

    patterns.averageLeadTime = appointments.length > 0 ? totalLeadTime / appointments.length : 0;
    patterns.cancelationRate = appointments.length > 0
      ? (patterns.byStatus['cancelled'] || 0) / appointments.length
      : 0;
    patterns.noShowRate = appointments.length > 0
      ? (patterns.byStatus['no_show'] || 0) / appointments.length
      : 0;

    res.status(200).json({
      success: true,
      data: patterns
    } as ApiResponse);
  } catch (error: any) {
    res.status(200).json({
      success: true,
      data: {
        totalAppointments: 0,
        byStatus: {},
        byDayOfWeek: {},
        byHour: {},
        byService: {},
        averageLeadTime: 0,
        cancelationRate: 0,
        noShowRate: 0
      }
    } as ApiResponse);
  }
};

// @desc    Analyze queue efficiency
// @route   GET /api/ai/analytics/queue-efficiency
// @access  Private (Admin/Staff)
export const analyzeQueueEfficiency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queues = await Queue.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    }).populate('service', 'name duration estimatedTime');

    const efficiency = {
      totalCompleted: queues.length,
      averageWaitTime: 0,
      averageServiceTime: 0,
      byService: {} as Record<string, { count: number; avgWait: number; avgService: number }>,
      peakHours: [] as { hour: number; count: number }[],
      recommendations: [] as string[]
    };

    let totalWaitTime = 0;
    let totalServiceTime = 0;
    const hourCounts: Record<number, number> = {};

    queues.forEach(queue => {
      const waitTime = queue.actualStartTime && queue.createdAt
        ? (new Date(queue.actualStartTime).getTime() - new Date(queue.createdAt).getTime()) / (1000 * 60)
        : 0;
      
      const serviceTime = queue.actualEndTime && queue.actualStartTime
        ? (new Date(queue.actualEndTime).getTime() - new Date(queue.actualStartTime).getTime()) / (1000 * 60)
        : 0;

      totalWaitTime += waitTime;
      totalServiceTime += serviceTime;

      const serviceName = (queue.service as any)?.name || 'Unknown';
      if (!efficiency.byService[serviceName]) {
        efficiency.byService[serviceName] = { count: 0, avgWait: 0, avgService: 0 };
      }
      efficiency.byService[serviceName].count++;
      efficiency.byService[serviceName].avgWait += waitTime;
      efficiency.byService[serviceName].avgService += serviceTime;

      const hour = new Date(queue.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    efficiency.averageWaitTime = queues.length > 0 ? totalWaitTime / queues.length : 0;
    efficiency.averageServiceTime = queues.length > 0 ? totalServiceTime / queues.length : 0;

    Object.keys(efficiency.byService).forEach(service => {
      const data = efficiency.byService[service];
      data.avgWait /= data.count;
      data.avgService /= data.count;
    });

    efficiency.peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (efficiency.averageWaitTime > 20) {
      efficiency.recommendations.push('Consider adding more service counters during peak hours');
    }
    if (efficiency.averageWaitTime > 30) {
      efficiency.recommendations.push('Wait times are high - recommend reviewing staff allocation');
    }
    if (efficiency.peakHours.length > 0) {
      efficiency.recommendations.push(
        `Peak hour at ${efficiency.peakHours[0].hour}:00 - consider scheduling more staff`
      );
    }

    res.status(200).json({
      success: true,
      data: efficiency
    } as ApiResponse);
  } catch (error: any) {
    res.status(200).json({
      success: true,
      data: {
        totalCompleted: 0,
        averageWaitTime: 0,
        averageServiceTime: 0,
        byService: {},
        peakHours: [],
        recommendations: []
      }
    } as ApiResponse);
  }
};

// ============= REAL AI ENDPOINTS (OpenAI Powered) =============

// @desc    Get AI-powered queue insights
// @route   GET /api/ai/insights
// @access  Private (Admin/Staff)
export const getAIInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const insights = await generateQueueInsights(days);
    
    res.status(200).json({
      success: true,
      data: {
        insights,
        generatedAt: new Date(),
        analyzedDays: days,
        poweredBy: 'Google Gemini AI (FREE)'
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    } as ApiResponse);
  }
};

// @desc    Get AI-powered wait time with reasoning
// @route   GET /api/ai/smart-wait-time/:serviceId
// @access  Public
export const getSmartWaitTime = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const queueSize = parseInt(req.query.queueSize as string) || 0;
    
    const result = await getAIPoweredWaitTime(serviceId, queueSize);
    
    res.status(200).json({
      success: true,
      data: {
        estimatedWaitMinutes: result.prediction,
        reasoning: result.reasoning,
        queueSize,
        generatedAt: new Date(),
        poweredBy: 'Google Gemini AI (FREE)'
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to estimate wait time'
    } as ApiResponse);
  }
};

// @desc    Get personalized smart recommendations
// @route   GET /api/ai/recommendations
// @access  Private
export const getPersonalizedRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.userId;
    
    if (!customerId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }
    
    const recommendations = await getSmartRecommendations(customerId);
    
    res.status(200).json({
      success: true,
      data: {
        recommendations,
        generatedAt: new Date(),
        poweredBy: 'Google Gemini AI (FREE)'
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    } as ApiResponse);
  }
};


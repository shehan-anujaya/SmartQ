import Queue from '../models/Queue';
import Appointment from '../models/Appointment';
import Service from '../models/Service';
import {
  IPeakHourPrediction,
  IWaitTimeEstimate,
  IAIAnalysisResult
} from '../types';

/**
 * AI Service Module for SmartQ
 * Provides predictive analytics for queue management and appointment scheduling
 * All operations are non-blocking and return default values on error
 */

/**
 * Analyze historical data to predict peak booking hours
 * @param days Number of days to analyze (default: 30)
 * @returns Array of peak hour predictions
 */
export const predictPeakHours = async (days: number = 30): Promise<IPeakHourPrediction[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch historical appointments and queue data
    const [appointments, queues] = await Promise.all([
      Appointment.find({
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled', 'no_show'] }
      }).select('createdAt appointmentDate appointmentTime'),
      Queue.find({
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled', 'no_show'] }
      }).select('createdAt')
    ]);

    // Group by hour and day of week
    const hourDayMap = new Map<string, number>();

    // Process appointments
    appointments.forEach((appointment) => {
      const date = new Date(appointment.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;
      hourDayMap.set(key, (hourDayMap.get(key) || 0) + 1);
    });

    // Process queues
    queues.forEach((queue) => {
      const date = new Date(queue.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;
      hourDayMap.set(key, (hourDayMap.get(key) || 0) + 1);
    });

    // Calculate total volume for confidence scoring
    const totalVolume = Array.from(hourDayMap.values()).reduce((sum, count) => sum + count, 0);
    const avgVolume = totalVolume / (hourDayMap.size || 1);

    // Convert to predictions array
    const predictions: IPeakHourPrediction[] = [];
    hourDayMap.forEach((volume, key) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      
      // Calculate confidence based on sample size and deviation from average
      const sampleConfidence = Math.min(volume / 10, 1); // More samples = higher confidence
      const volumeConfidence = volume > avgVolume ? 0.8 : 0.5;
      const confidence = (sampleConfidence + volumeConfidence) / 2;

      predictions.push({
        hour,
        dayOfWeek,
        predictedVolume: Math.round(volume),
        confidence: Math.round(confidence * 100) / 100
      });
    });

    // Sort by predicted volume (descending)
    predictions.sort((a, b) => b.predictedVolume - a.predictedVolume);

    // Return top 20 peak hours
    return predictions.slice(0, 20);
  } catch (error) {
    console.error('Error predicting peak hours:', error);
    // Return safe default on error (non-blocking)
    return [];
  }
};

/**
 * Estimate waiting time for a specific queue position and service
 * @param serviceId Service being requested
 * @param currentQueueSize Number of people ahead in queue
 * @returns Wait time estimate with confidence
 */
export const estimateWaitTime = async (
  serviceId: string,
  currentQueueSize: number = 0
): Promise<IWaitTimeEstimate> => {
  try {
    // Fetch service details
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const baseDuration = service.duration; // in minutes

    // Fetch historical queue data for this service (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const completedQueues = await Queue.find({
      service: serviceId,
      status: 'completed',
      actualStartTime: { $exists: true },
      actualEndTime: { $exists: true },
      createdAt: { $gte: startDate }
    }).select('actualStartTime actualEndTime');

    // Calculate actual service times
    const actualDurations: number[] = [];
    completedQueues.forEach((queue) => {
      if (queue.actualStartTime && queue.actualEndTime) {
        const durationMs = queue.actualEndTime.getTime() - queue.actualStartTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        actualDurations.push(durationMinutes);
      }
    });

    // Calculate average actual service time
    let averageServiceTime = baseDuration;
    let confidence = 0.5; // Default medium confidence

    if (actualDurations.length > 0) {
      const sum = actualDurations.reduce((acc, dur) => acc + dur, 0);
      averageServiceTime = Math.round(sum / actualDurations.length);
      
      // Higher confidence with more data points
      confidence = Math.min(0.5 + (actualDurations.length / 100), 0.95);
    }

    // Account for variability (add buffer time)
    const bufferMultiplier = 1.15; // 15% buffer for variability
    const adjustedServiceTime = Math.round(averageServiceTime * bufferMultiplier);

    // Calculate estimated wait time
    const estimatedWaitMinutes = adjustedServiceTime * currentQueueSize;

    return {
      estimatedWaitMinutes,
      queuePosition: currentQueueSize + 1,
      totalAhead: currentQueueSize,
      averageServiceTime: adjustedServiceTime,
      confidence: Math.round(confidence * 100) / 100
    };
  } catch (error) {
    console.error('Error estimating wait time:', error);
    // Return safe default estimate on error (non-blocking)
    return {
      estimatedWaitMinutes: currentQueueSize * 15, // Assume 15 min per person
      queuePosition: currentQueueSize + 1,
      totalAhead: currentQueueSize,
      averageServiceTime: 15,
      confidence: 0.3 // Low confidence for fallback
    };
  }
};

/**
 * Comprehensive AI analysis combining peak hours and wait time
 * @param serviceId Optional service ID for wait time estimation
 * @param currentQueueSize Optional queue size for wait time estimation
 * @returns Complete AI analysis result
 */
export const performAIAnalysis = async (
  serviceId?: string,
  currentQueueSize?: number
): Promise<IAIAnalysisResult> => {
  try {
    const peakHoursPromise = predictPeakHours();
    const waitTimePromise = serviceId
      ? estimateWaitTime(serviceId, currentQueueSize || 0)
      : Promise.resolve(undefined);

    const [peakHours, waitTimeEstimate] = await Promise.all([
      peakHoursPromise,
      waitTimePromise
    ]);

    return {
      peakHours,
      waitTimeEstimate,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error performing AI analysis:', error);
    return {
      timestamp: new Date()
    };
  }
};

/**
 * Get optimal time slots for appointment booking based on predicted low traffic
 * @param dayOfWeek Day of week (0-6)
 * @param excludeHours Hours to exclude (e.g., outside business hours)
 * @returns Array of recommended hours with reasoning
 */
export const getOptimalBookingSlots = async (
  dayOfWeek: number,
  excludeHours: number[] = []
): Promise<Array<{ hour: number; reason: string; confidence: number }>> => {
  try {
    const peakHours = await predictPeakHours();
    
    // Filter for specific day
    const dayPeakHours = peakHours.filter((ph) => ph.dayOfWeek === dayOfWeek);
    
    // Create a map of hours to volumes
    const hourVolumeMap = new Map<number, number>();
    dayPeakHours.forEach((ph) => {
      hourVolumeMap.set(ph.hour, ph.predictedVolume);
    });

    // Find low-traffic hours
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const availableHours = allHours.filter((hour) => !excludeHours.includes(hour));
    
    const recommendations = availableHours
      .map((hour) => {
        const volume = hourVolumeMap.get(hour) || 0;
        const avgVolume =
          Array.from(hourVolumeMap.values()).reduce((sum, v) => sum + v, 0) /
          (hourVolumeMap.size || 1);
        
        let reason = 'Low traffic period';
        let confidence = 0.6;

        if (volume === 0) {
          reason = 'Historically quiet period';
          confidence = 0.8;
        } else if (volume < avgVolume * 0.5) {
          reason = 'Below average traffic';
          confidence = 0.75;
        } else if (volume < avgVolume) {
          reason = 'Moderate traffic';
          confidence = 0.65;
        } else {
          return null; // Skip high-traffic hours
        }

        return { hour, reason, confidence };
      })
      .filter((rec): rec is { hour: number; reason: string; confidence: number } => rec !== null);

    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  } catch (error) {
    console.error('Error getting optimal booking slots:', error);
    return [];
  }
};

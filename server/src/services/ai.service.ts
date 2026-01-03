import Queue from '../models/Queue.model';
import QueueEntry from '../models/QueueEntry.model';
import Appointment from '../models/Appointment.model';
import Counter from '../models/Counter.model';
import { PeakHourPrediction, WaitTimeEstimation } from '../types';

/**
 * AI Service Module
 * Provides optional, non-blocking AI predictions and estimations
 */

/**
 * Predict peak booking hours based on historical data
 * @param serviceId - Optional service ID to filter predictions
 * @param daysBack - Number of days to analyze (default: 30)
 */
export const predictPeakHours = async (
  serviceId?: string,
  daysBack: number = 30
): Promise<PeakHourPrediction[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Build query
    const query: any = {
      createdAt: { $gte: startDate }
    };
    if (serviceId) {
      query.service = serviceId;
    }

    // Aggregate appointments by hour
    const appointmentsByHour = await Appointment.aggregate([
      { $match: query },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
          days: { $addToSet: '$date' }
        }
      },
      {
        $project: {
          hour: '$_id',
          totalCount: '$count',
          uniqueDays: { $size: '$days' },
          avgPerDay: { $divide: ['$count', { $size: '$days' }] }
        }
      },
      { $sort: { avgPerDay: -1 } }
    ]);

    // Calculate confidence based on sample size
    const totalAppointments = appointmentsByHour.reduce(
      (sum, h) => sum + h.totalCount,
      0
    );

    const predictions: PeakHourPrediction[] = appointmentsByHour.map((hourData) => {
      // Confidence increases with more data points
      const confidence = Math.min(
        (hourData.uniqueDays / daysBack) * (hourData.totalCount / totalAppointments) * 100,
        95
      );

      return {
        hour: hourData.hour,
        predictedCount: Math.round(hourData.avgPerDay * 10) / 10,
        confidence: Math.round(confidence * 10) / 10
      };
    });

    return predictions;
  } catch (error) {
    console.error('AI Prediction Error (Peak Hours):', error);
    return [];
  }
};

/**
 * Estimate queue waiting time using current queue state and historical data
 * @param queueId - Queue ID to estimate
 * @param serviceId - Service ID for better estimation
 */
export const estimateWaitTime = async (
  queueId: string,
  serviceId: string
): Promise<WaitTimeEstimation> => {
  try {
    // Get current queue state
    const waitingEntries = await QueueEntry.countDocuments({
      queue: queueId,
      status: 'waiting'
    });

    const inServiceEntries = await QueueEntry.countDocuments({
      queue: queueId,
      status: 'in_service'
    });

    // Get available counters for this service
    const availableCounters = await Counter.countDocuments({
      services: serviceId,
      status: 'active'
    });

    // Get historical average service time
    const completedEntries = await QueueEntry.find({
      service: serviceId,
      status: 'completed',
      startedAt: { $exists: true },
      completedAt: { $exists: true }
    })
      .sort({ completedAt: -1 })
      .limit(50);

    let avgServiceTime = 10; // Default 10 minutes
    if (completedEntries.length > 0) {
      const totalTime = completedEntries.reduce((sum, entry) => {
        const serviceTime =
          (new Date(entry.completedAt!).getTime() -
            new Date(entry.startedAt!).getTime()) /
          (1000 * 60);
        return sum + serviceTime;
      }, 0);
      avgServiceTime = totalTime / completedEntries.length;
    }

    // Calculate estimated wait time
    const countersInUse = Math.max(inServiceEntries, availableCounters);
    const effectiveCounters = Math.max(countersInUse, 1);
    
    let estimatedMinutes: number;
    if (availableCounters === 0) {
      // No counters available - very rough estimate
      estimatedMinutes = waitingEntries * avgServiceTime;
    } else {
      // Calculate based on parallel processing
      const queueDepth = Math.ceil(waitingEntries / effectiveCounters);
      estimatedMinutes = queueDepth * avgServiceTime;
    }

    // Calculate confidence
    const dataPoints = completedEntries.length;
    const baseConfidence = Math.min((dataPoints / 50) * 70, 70);
    const counterConfidence = availableCounters > 0 ? 20 : 5;
    const recentDataConfidence = waitingEntries > 0 ? 10 : 5;
    
    const confidence = Math.round(
      baseConfidence + counterConfidence + recentDataConfidence
    );

    return {
      estimatedMinutes: Math.round(estimatedMinutes),
      confidence: Math.min(confidence, 95),
      basedOn: {
        queueLength: waitingEntries,
        averageServiceTime: Math.round(avgServiceTime * 10) / 10,
        counterAvailability: availableCounters
      }
    };
  } catch (error) {
    console.error('AI Estimation Error (Wait Time):', error);
    // Return safe fallback
    return {
      estimatedMinutes: 15,
      confidence: 30,
      basedOn: {
        queueLength: 0,
        averageServiceTime: 10,
        counterAvailability: 1
      }
    };
  }
};

/**
 * Get optimal counter assignment for a queue entry
 * @param serviceId - Service ID
 * @param priority - Entry priority (0-10)
 */
export const getOptimalCounter = async (
  serviceId: string,
  priority: number = 0
): Promise<string | null> => {
  try {
    // Find active counters that support this service
    const counters = await Counter.find({
      services: serviceId,
      status: 'active'
    }).populate('currentQueue');

    if (counters.length === 0) {
      return null;
    }

    // Score each counter
    const scoredCounters = await Promise.all(
      counters.map(async (counter) => {
        let score = 100;

        // Get current queue length for this counter
        const queueLength = await QueueEntry.countDocuments({
          counter: counter._id,
          status: { $in: ['waiting', 'called', 'in_service'] }
        });

        // Penalize busy counters
        score -= queueLength * 10;

        // Prefer counters with lower average service time
        if (counter.averageServiceTime > 0) {
          score -= counter.averageServiceTime * 0.5;
        }

        // Bonus for idle counters
        const currentlyServing = await QueueEntry.countDocuments({
          counter: counter._id,
          status: 'in_service'
        });
        if (currentlyServing === 0) {
          score += 30;
        }

        return {
          counterId: counter._id.toString(),
          score: Math.max(score, 0)
        };
      })
    );

    // Sort by score and return best counter
    scoredCounters.sort((a, b) => b.score - a.score);
    return scoredCounters[0].counterId;
  } catch (error) {
    console.error('AI Error (Counter Assignment):', error);
    return null;
  }
};

/**
 * Predict busy days for a service based on historical patterns
 * @param serviceId - Service ID
 * @param daysAhead - Number of days to predict (default: 7)
 */
export const predictBusyDays = async (
  serviceId: string,
  daysAhead: number = 7
): Promise<{ date: string; expectedLoad: number; confidence: number }[]> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get historical data by day of week
    const historicalData = await Appointment.aggregate([
      {
        $match: {
          service: serviceId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$appointmentDate' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          count: { $sum: 1 },
          uniqueDates: { $addToSet: '$date' }
        }
      }
    ]);

    // Build predictions for upcoming days
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + i);
      const dayOfWeek = targetDate.getDay() + 1; // MongoDB uses 1-7

      const historicalDayData = historicalData.find((d) => d._id === dayOfWeek);
      
      if (historicalDayData) {
        const avgCount = historicalDayData.count / historicalDayData.uniqueDates.length;
        const confidence = Math.min(
          (historicalDayData.uniqueDates.length / 4) * 100,
          90
        );

        predictions.push({
          date: targetDate.toISOString().split('T')[0],
          expectedLoad: Math.round(avgCount),
          confidence: Math.round(confidence)
        });
      } else {
        predictions.push({
          date: targetDate.toISOString().split('T')[0],
          expectedLoad: 5,
          confidence: 20
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('AI Prediction Error (Busy Days):', error);
    return [];
  }
};

export default {
  predictPeakHours,
  estimateWaitTime,
  getOptimalCounter,
  predictBusyDays
};

import OpenAI from 'openai';
import Queue from '../models/Queue';
import Appointment from '../models/Appointment';
import Service from '../models/Service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Check if OpenAI is configured
const isOpenAIConfigured = (): boolean => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
};

/**
 * Generate AI-powered queue insights using OpenAI
 * @param days Number of days to analyze
 * @returns Intelligent insights about queue patterns
 */
export const generateQueueInsights = async (days: number = 30): Promise<string> => {
  if (!isOpenAIConfigured()) {
    return 'OpenAI API key not configured. Please add your API key to use AI insights.';
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch historical data
    const [queues, appointments] = await Promise.all([
      Queue.find({
        createdAt: { $gte: startDate }
      })
        .populate('service', 'name category')
        .select('status createdAt estimatedTime actualStartTime actualEndTime'),
      Appointment.find({
        createdAt: { $gte: startDate }
      })
        .populate('service', 'name category')
        .select('status appointmentDate appointmentTime')
    ]);

    // Prepare data summary for AI
    const queueStats = {
      total: queues.length,
      completed: queues.filter(q => q.status === 'completed').length,
      cancelled: queues.filter(q => q.status === 'cancelled').length,
      avgWaitTime: calculateAvgWaitTime(queues),
      peakHours: findPeakHours(queues),
      popularServices: findPopularServices(queues)
    };

    const appointmentStats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'no_show').length
    };

    // Create prompt for OpenAI
    const prompt = `You are an AI analytics assistant for a queue management system. Analyze the following data from the past ${days} days and provide actionable insights:

Queue Statistics:
- Total Queues: ${queueStats.total}
- Completed: ${queueStats.completed}
- Cancelled: ${queueStats.cancelled}
- Average Wait Time: ${queueStats.avgWaitTime} minutes
- Peak Hours: ${JSON.stringify(queueStats.peakHours)}
- Popular Services: ${JSON.stringify(queueStats.popularServices)}

Appointment Statistics:
- Total Appointments: ${appointmentStats.total}
- Completed: ${appointmentStats.completed}
- Cancelled: ${appointmentStats.cancelled}
- No-shows: ${appointmentStats.noShow}

Provide:
1. Key patterns and trends
2. Recommendations to reduce wait times
3. Suggestions to improve customer satisfaction
4. Staffing recommendations based on peak hours
5. Service optimization suggestions

Keep the response concise and actionable (max 400 words).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst specializing in queue management and customer service optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || 'Unable to generate insights at this time.';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    if (error.code === 'invalid_api_key') {
      return 'Invalid OpenAI API key. Please check your configuration.';
    }
    return 'Unable to generate AI insights. Please try again later.';
  }
};

/**
 * Get AI-powered wait time prediction with explanation
 * @param serviceId Service ID
 * @param currentQueueSize Current queue size
 * @returns Prediction with AI reasoning
 */
export const getAIPoweredWaitTime = async (
  serviceId: string,
  currentQueueSize: number
): Promise<{ prediction: number; reasoning: string }> => {
  if (!isOpenAIConfigured()) {
    return {
      prediction: currentQueueSize * 15,
      reasoning: 'Standard estimate (AI not configured): ~15 minutes per person in queue.'
    };
  }

  try {
    // Fetch service and historical data
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const completedQueues = await Queue.find({
      service: serviceId,
      status: 'completed',
      actualStartTime: { $exists: true },
      actualEndTime: { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('actualStartTime actualEndTime createdAt');

    // Calculate actual durations
    const durations = completedQueues.map(q => {
      if (q.actualStartTime && q.actualEndTime) {
        return Math.round((q.actualEndTime.getTime() - q.actualStartTime.getTime()) / 60000);
      }
      return null;
    }).filter(d => d !== null) as number[];

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : service.duration;

    // Get current time context
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Estimate wait time for a queue:
- Service: ${service.name} (Base duration: ${service.duration} min)
- Historical avg: ${avgDuration} min (from ${durations.length} samples)
- People ahead: ${currentQueueSize}
- Current time: ${dayOfWeek}, ${hour}:00
- Category: ${service.category}

Provide:
1. Estimated wait time in minutes (just the number)
2. Brief reasoning (2-3 sentences) considering time of day, service type, and queue size.

Format: 
MINUTES: [number]
REASONING: [explanation]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a queue management AI that predicts wait times accurately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.5
    });

    const response = completion.choices[0]?.message?.content || '';
    const minutesMatch = response.match(/MINUTES:\s*(\d+)/i);
    const reasoningMatch = response.match(/REASONING:\s*(.+)/is);

    const prediction = minutesMatch ? parseInt(minutesMatch[1]) : currentQueueSize * avgDuration;
    const reasoning = reasoningMatch
      ? reasoningMatch[1].trim()
      : `Based on ${currentQueueSize} people ahead, estimated ${prediction} minutes.`;

    return { prediction, reasoning };
  } catch (error: any) {
    console.error('AI Wait Time Error:', error);
    const fallbackTime = currentQueueSize * 15;
    return {
      prediction: fallbackTime,
      reasoning: `Standard estimate: ~${fallbackTime} minutes (${currentQueueSize} people × 15 min average).`
    };
  }
};

/**
 * Generate smart appointment recommendations using AI
 * @param customerId Customer ID
 * @returns Personalized recommendations
 */
export const getSmartRecommendations = async (customerId: string): Promise<string[]> => {
  if (!isOpenAIConfigured()) {
    return [
      'Book appointments during off-peak hours (9-11 AM, 2-4 PM)',
      'Consider scheduling recurring services in advance',
      'Check wait times before joining the queue'
    ];
  }

  try {
    // Fetch customer's history
    const [appointments, queues] = await Promise.all([
      Appointment.find({ customer: customerId })
        .populate('service', 'name category')
        .sort({ createdAt: -1 })
        .limit(10),
      Queue.find({ customer: customerId })
        .populate('service', 'name category')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const serviceCategories = [...new Set([
      ...appointments.map(a => a.service?.category).filter(Boolean),
      ...queues.map(q => q.service?.category).filter(Boolean)
    ])];

    const prompt = `Generate 3-5 personalized recommendations for a customer with:
- Past services: ${serviceCategories.join(', ')}
- Total appointments: ${appointments.length}
- Queue visits: ${queues.length}

Provide actionable tips to improve their experience, save time, and get better service.
Format as a simple array of recommendation strings.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful customer service AI assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    const response = completion.choices[0]?.message?.content || '';
    const recommendations = response
      .split('\n')
      .filter(line => line.trim().length > 10)
      .map(line => line.replace(/^[-•*\d.]+\s*/, '').trim())
      .slice(0, 5);

    return recommendations.length > 0 ? recommendations : [
      'Book appointments in advance to avoid waiting',
      'Check real-time queue status before visiting',
      'Consider off-peak hours for faster service'
    ];
  } catch (error) {
    console.error('Smart Recommendations Error:', error);
    return [
      'Book appointments during quiet hours',
      'Use online scheduling to save time',
      'Check queue status before arriving'
    ];
  }
};

// Helper functions
function calculateAvgWaitTime(queues: any[]): number {
  const completedWithTimes = queues.filter(
    q => q.status === 'completed' && q.actualStartTime && q.actualEndTime
  );
  
  if (completedWithTimes.length === 0) return 0;
  
  const totalTime = completedWithTimes.reduce((sum, q) => {
    const duration = (q.actualEndTime.getTime() - q.actualStartTime.getTime()) / 60000;
    return sum + duration;
  }, 0);
  
  return Math.round(totalTime / completedWithTimes.length);
}

function findPeakHours(queues: any[]): { hour: number; count: number }[] {
  const hourCounts = new Map<number, number>();
  
  queues.forEach(q => {
    const hour = new Date(q.createdAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  return Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function findPopularServices(queues: any[]): { service: string; count: number }[] {
  const serviceCounts = new Map<string, number>();
  
  queues.forEach(q => {
    if (q.service?.name) {
      const name = q.service.name;
      serviceCounts.set(name, (serviceCounts.get(name) || 0) + 1);
    }
  });
  
  return Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

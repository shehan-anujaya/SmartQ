import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import QueueEntry from '../models/QueueEntry.model';
import Queue from '../models/Queue.model';
import Counter from '../models/Counter.model';
import { estimateWaitTime, getOptimalCounter } from '../services/ai.service';

// @desc    Get all queue entries
// @route   GET /api/queue-entries
// @access  Private (Admin/Staff)
export const getQueueEntries = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { queue, status, counter, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (queue) query.queue = queue;
    if (status) query.status = status;
    if (counter) query.counter = counter;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const entries = await QueueEntry.find(query)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration')
      .populate('counter', 'name counterNumber')
      .populate('queue', 'name status')
      .sort({ entryNumber: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await QueueEntry.countDocuments(query);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: entries.length,
        totalRecords: total
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get my queue entries
// @route   GET /api/queue-entries/my
// @access  Private (Customer)
export const getMyQueueEntries = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    const query: any = { customer: userId };
    if (status) query.status = status;

    const entries = await QueueEntry.find(query)
      .populate('service', 'name duration price')
      .populate('counter', 'name counterNumber')
      .populate('queue', 'name status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: entries
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get single queue entry
// @route   GET /api/queue-entries/:id
// @access  Private
export const getQueueEntry = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const entry = await QueueEntry.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration price')
      .populate('counter', 'name counterNumber status')
      .populate('queue', 'name status currentCount');

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Queue entry not found'
      } as ApiResponse);
      return;
    }

    // Check authorization
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (
      userRole === 'customer' &&
      entry.customer.toString() !== userId
    ) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view this entry'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: entry
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Join queue (create entry)
// @route   POST /api/queue-entries
// @access  Private (Customer)
export const joinQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { queue, service, priority = 0, notes } = req.body;

    // Check if queue exists and is active
    const queueDoc = await Queue.findById(queue);
    if (!queueDoc) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    if (queueDoc.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Queue is not active'
      } as ApiResponse);
      return;
    }

    // Check if already in this queue
    const existingEntry = await QueueEntry.findOne({
      customer: userId,
      queue,
      status: { $in: ['waiting', 'called', 'in_service'] }
    });

    if (existingEntry) {
      res.status(400).json({
        success: false,
        error: 'You are already in this queue'
      } as ApiResponse);
      return;
    }

    // Check capacity
    if (queueDoc.currentCount >= queueDoc.maxCapacity) {
      res.status(400).json({
        success: false,
        error: 'Queue is at full capacity'
      } as ApiResponse);
      return;
    }

    // Get AI-based wait time estimation
    const waitTimeEstimation = await estimateWaitTime(queue, service);

    // Get optimal counter assignment (optional, non-blocking)
    const optimalCounter = await getOptimalCounter(service, priority);

    // Create entry
    const entry = await QueueEntry.create({
      customer: userId,
      queue,
      service,
      priority,
      notes,
      estimatedWaitTime: waitTimeEstimation.estimatedMinutes,
      counter: optimalCounter || undefined,
      status: 'waiting'
    });

    // Update queue count
    queueDoc.currentCount += 1;
    await queueDoc.save();

    const populatedEntry = await QueueEntry.findById(entry._id)
      .populate('service', 'name duration')
      .populate('counter', 'name counterNumber')
      .populate('queue', 'name');

    res.status(201).json({
      success: true,
      message: 'Successfully joined the queue',
      data: {
        entry: populatedEntry,
        aiPrediction: {
          estimatedWaitTime: waitTimeEstimation.estimatedMinutes,
          confidence: waitTimeEstimation.confidence,
          basedOn: waitTimeEstimation.basedOn
        }
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update queue entry status
// @route   PUT /api/queue-entries/:id/status
// @access  Private (Admin/Staff)
export const updateQueueEntryStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, counter } = req.body;

    const entry = await QueueEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Queue entry not found'
      } as ApiResponse);
      return;
    }

    // Update timestamps based on status
    const updates: any = { status };

    if (status === 'called') {
      updates.calledAt = new Date();
      if (counter) updates.counter = counter;
    } else if (status === 'in_service') {
      updates.startedAt = new Date();
      if (counter) updates.counter = counter;
    } else if (status === 'completed') {
      updates.completedAt = new Date();
      
      // Calculate actual wait time
      if (entry.joinedAt && entry.startedAt) {
        const waitTime = Math.round(
          (new Date(entry.startedAt).getTime() - new Date(entry.joinedAt).getTime()) / 
          (1000 * 60)
        );
        updates.actualWaitTime = waitTime;
      }

      // Update counter average service time
      if (entry.counter && entry.startedAt) {
        const serviceTime = Math.round(
          (new Date().getTime() - new Date(entry.startedAt).getTime()) / 
          (1000 * 60)
        );
        
        const counterDoc = await Counter.findById(entry.counter);
        if (counterDoc) {
          // Moving average calculation
          const currentAvg = counterDoc.averageServiceTime || 0;
          const newAvg = currentAvg === 0 
            ? serviceTime 
            : (currentAvg * 0.8 + serviceTime * 0.2);
          
          await Counter.findByIdAndUpdate(entry.counter, {
            averageServiceTime: newAvg
          });
        }
      }

      // Decrement queue count
      await Queue.findByIdAndUpdate(entry.queue, {
        $inc: { currentCount: -1 }
      });
    } else if (status === 'cancelled' || status === 'no_show') {
      // Decrement queue count
      await Queue.findByIdAndUpdate(entry.queue, {
        $inc: { currentCount: -1 }
      });
    }

    const updatedEntry = await QueueEntry.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('customer service counter queue');

    res.status(200).json({
      success: true,
      message: 'Queue entry status updated successfully',
      data: updatedEntry
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Cancel queue entry
// @route   DELETE /api/queue-entries/:id
// @access  Private (Customer - own only, Admin/Staff - all)
export const cancelQueueEntry = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const entry = await QueueEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Queue entry not found'
      } as ApiResponse);
      return;
    }

    // Check authorization
    if (userRole === 'customer' && entry.customer.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this entry'
      } as ApiResponse);
      return;
    }

    // Can only cancel if waiting or called
    if (!['waiting', 'called'].includes(entry.status)) {
      res.status(400).json({
        success: false,
        error: 'Can only cancel entries with waiting or called status'
      } as ApiResponse);
      return;
    }

    // Update status to cancelled
    entry.status = 'cancelled' as any;
    await entry.save();

    // Decrement queue count
    await Queue.findByIdAndUpdate(entry.queue, {
      $inc: { currentCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Queue entry cancelled successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

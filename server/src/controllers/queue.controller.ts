import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import Queue from '../models/Queue.model';
import QueueEntry from '../models/QueueEntry.model';
import { predictPeakHours, predictBusyDays } from '../services/ai.service';

// @desc    Get all queues
// @route   GET /api/queues
// @access  Private (Admin/Staff)
export const getQueues = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, service, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (service) query.service = service;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const queues = await Queue.find(query)
      .populate('service', 'name duration category')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Queue.countDocuments(query);

    res.status(200).json({
      success: true,
      data: queues,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: queues.length,
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

// @desc    Get single queue
// @route   GET /api/queues/:id
// @access  Private
export const getQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('service', 'name duration price category');

    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    // Get current entries count by status
    const entriesByStatus = await QueueEntry.aggregate([
      { $match: { queue: queue._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        queue,
        entriesByStatus
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Create queue
// @route   POST /api/queues
// @access  Private (Admin/Staff)
export const createQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, service, date, maxCapacity, description } = req.body;

    const queue = await Queue.create({
      name,
      service,
      date: date || new Date(),
      maxCapacity,
      description,
      status: 'active'
    });

    const populatedQueue = await Queue.findById(queue._id)
      .populate('service', 'name duration');

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      data: populatedQueue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update queue
// @route   PUT /api/queues/:id
// @access  Private (Admin/Staff)
export const updateQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, service, date, maxCapacity, description, status } = req.body;

    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      req.params.id,
      { name, service, date, maxCapacity, description, status },
      { new: true, runValidators: true }
    ).populate('service', 'name duration');

    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      data: updatedQueue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Delete queue
// @route   DELETE /api/queues/:id
// @access  Private (Admin)
export const deleteQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    // Check if queue has active entries
    const activeEntries = await QueueEntry.countDocuments({
      queue: queue._id,
      status: { $in: ['waiting', 'called', 'in_service'] }
    });

    if (activeEntries > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete queue with active entries'
      } as ApiResponse);
      return;
    }

    await queue.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Queue deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update queue status
// @route   PATCH /api/queues/:id/status
// @access  Private (Admin/Staff)
export const updateQueueStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('service', 'name duration');

    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Queue status updated successfully',
      data: queue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get queue analytics (AI-powered)
// @route   GET /api/queues/:id/analytics
// @access  Private (Admin/Staff)
export const getQueueAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const queue = await Queue.findById(req.params.id).populate('service');
    
    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    // Get AI predictions (non-blocking)
    const [peakHours, busyDays] = await Promise.all([
      predictPeakHours(queue.service.toString(), 30),
      predictBusyDays(queue.service.toString(), 7)
    ]);

    // Get historical stats
    const completedEntries = await QueueEntry.find({
      queue: queue._id,
      status: 'completed',
      actualWaitTime: { $exists: true }
    });

    const avgWaitTime = completedEntries.length > 0
      ? completedEntries.reduce((sum, e) => sum + (e.actualWaitTime || 0), 0) / completedEntries.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        queue: {
          _id: queue._id,
          name: queue.name,
          currentCount: queue.currentCount,
          maxCapacity: queue.maxCapacity
        },
        analytics: {
          averageWaitTime: Math.round(avgWaitTime * 10) / 10,
          totalCompleted: completedEntries.length,
          peakHours: peakHours.slice(0, 5),
          busyDaysPrediction: busyDays
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

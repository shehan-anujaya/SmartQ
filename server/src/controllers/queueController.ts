import { Response } from 'express';
import Queue from '../models/Queue';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, QueueStatus } from '../types';

// @desc    Get all queues
// @route   GET /api/queues
// @access  Private
export const getQueues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const queues = await Queue.find(filter)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration')
      .sort({ priority: -1, createdAt: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Queue.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        queues,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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

// @desc    Get my queues
// @route   GET /api/queues/my-queues
// @access  Private (Customer)
export const getMyQueues = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const queues = await Queue.find({ customer: req.user?.userId })
      .populate('service', 'name duration price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: queues
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
export const getQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('service', 'name description duration price');

    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: queue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Join queue
// @route   POST /api/queues
// @access  Private (Customer)
export const joinQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { service, priority = 0, notes } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      } as ApiResponse);
      return;
    }

    // Check if user already in queue for this service
    const existingQueue = await Queue.findOne({
      customer: req.user?.userId,
      service,
      status: { $in: [QueueStatus.WAITING, QueueStatus.IN_PROGRESS] }
    });

    if (existingQueue) {
      res.status(400).json({
        success: false,
        error: 'You are already in queue for this service'
      } as ApiResponse);
      return;
    }

    // Calculate estimated time
    const waitingQueues = await Queue.countDocuments({
      service,
      status: QueueStatus.WAITING
    });

    const estimatedTime = new Date();
    estimatedTime.setMinutes(
      estimatedTime.getMinutes() + waitingQueues * serviceExists.duration
    );

    // Create queue entry
    const queue = await Queue.create({
      customer: req.user?.userId,
      service,
      priority,
      estimatedTime,
      notes,
      status: QueueStatus.WAITING
    });

    const populatedQueue = await Queue.findById(queue._id)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration price');

    res.status(201).json({
      success: true,
      message: 'Successfully joined queue',
      data: populatedQueue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update queue status
// @route   PUT /api/queues/:id/status
// @access  Private (Admin/Staff)
export const updateQueueStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    // Update timestamps based on status
    if (status === QueueStatus.IN_PROGRESS && !queue.actualStartTime) {
      queue.actualStartTime = new Date();
    }

    if (
      [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW].includes(
        status as QueueStatus
      ) &&
      !queue.actualEndTime
    ) {
      queue.actualEndTime = new Date();
    }

    queue.status = status;
    await queue.save();

    const updatedQueue = await Queue.findById(queue._id)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration');

    res.status(200).json({
      success: true,
      message: 'Queue status updated successfully',
      data: updatedQueue
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Cancel queue
// @route   DELETE /api/queues/:id
// @access  Private (Customer - own queue, Admin/Staff - any)
export const cancelQueue = async (
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

    // Check authorization
    if (
      queue.customer.toString() !== req.user?.userId &&
      req.user?.role === 'customer'
    ) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this queue'
      } as ApiResponse);
      return;
    }

    // Can only cancel if waiting
    if (queue.status !== QueueStatus.WAITING) {
      res.status(400).json({
        success: false,
        error: 'Can only cancel waiting queues'
      } as ApiResponse);
      return;
    }

    queue.status = QueueStatus.CANCELLED;
    queue.actualEndTime = new Date();
    await queue.save();

    res.status(200).json({
      success: true,
      message: 'Queue cancelled successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get queue statistics
// @route   GET /api/queues/stats/overview
// @access  Private (Admin/Staff)
export const getQueueStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const totalWaiting = await Queue.countDocuments({ status: QueueStatus.WAITING });
    const totalInProgress = await Queue.countDocuments({
      status: QueueStatus.IN_PROGRESS
    });
    const totalCompleted = await Queue.countDocuments({
      status: QueueStatus.COMPLETED
    });
    const totalCancelled = await Queue.countDocuments({
      status: QueueStatus.CANCELLED
    });

    res.status(200).json({
      success: true,
      data: {
        waiting: totalWaiting,
        inProgress: totalInProgress,
        completed: totalCompleted,
        cancelled: totalCancelled,
        total: totalWaiting + totalInProgress + totalCompleted + totalCancelled
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

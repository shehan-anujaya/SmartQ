import { Response } from 'express';
import Counter from '../models/Counter';
import Queue from '../models/Queue';
import { AuthRequest, ApiResponse, CounterStatus, QueueStatus } from '../types';

// @desc    Get all counters with pagination
// @route   GET /api/counters
// @access  Private (Admin/Staff)
export const getCounters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const counters = await Counter.find(filter)
      .populate('services', 'name category duration')
      .populate('assignedStaff', 'name email role')
      .populate('currentQueue', 'queueNumber customer status')
      .skip(skip)
      .limit(limit)
      .sort({ counterNumber: 1 });

    const total = await Counter.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        counters,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// @desc    Get single counter
// @route   GET /api/counters/:id
// @access  Private
export const getCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counter = await Counter.findById(req.params.id)
      .populate('services', 'name category duration price')
      .populate('assignedStaff', 'name email phone role')
      .populate({
        path: 'currentQueue',
        populate: [
          { path: 'customer', select: 'name email phone' },
          { path: 'service', select: 'name duration' }
        ]
      });

    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: counter
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Create new counter
// @route   POST /api/counters
// @access  Private (Admin only)
export const createCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { counterNumber, name, services, assignedStaff } = req.body;

    // Check if counter number already exists
    const existingCounter = await Counter.findOne({ counterNumber });
    if (existingCounter) {
      res.status(400).json({
        success: false,
        error: 'Counter number already exists'
      } as ApiResponse);
      return;
    }

    const counter = await Counter.create({
      counterNumber,
      name,
      services,
      assignedStaff: assignedStaff || null
    });

    const populatedCounter = await Counter.findById(counter._id)
      .populate('services', 'name category')
      .populate('assignedStaff', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Counter created successfully',
      data: populatedCounter
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update counter
// @route   PUT /api/counters/:id
// @access  Private (Admin only)
export const updateCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { counterNumber, name, services, status, assignedStaff } = req.body;

    const counter = await Counter.findById(req.params.id);

    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    // Check if updating counter number to an existing one
    if (counterNumber && counterNumber !== counter.counterNumber) {
      const existingCounter = await Counter.findOne({ counterNumber });
      if (existingCounter) {
        res.status(400).json({
          success: false,
          error: 'Counter number already exists'
        } as ApiResponse);
        return;
      }
    }

    // Update fields
    if (counterNumber !== undefined) counter.counterNumber = counterNumber;
    if (name !== undefined) counter.name = name;
    if (services !== undefined) counter.services = services;
    if (status !== undefined) counter.status = status;
    if (assignedStaff !== undefined) counter.assignedStaff = assignedStaff;

    await counter.save();

    const updatedCounter = await Counter.findById(counter._id)
      .populate('services', 'name category')
      .populate('assignedStaff', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Counter updated successfully',
      data: updatedCounter
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Delete counter
// @route   DELETE /api/counters/:id
// @access  Private (Admin only)
export const deleteCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counter = await Counter.findById(req.params.id);

    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    // Check if counter has active queue
    if (counter.currentQueue) {
      const queue = await Queue.findById(counter.currentQueue);
      if (queue && (queue.status === 'waiting' || queue.status === 'in_progress')) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete counter with active queue. Please complete or reassign the queue first.'
        } as ApiResponse);
        return;
      }
    }

    await counter.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Counter deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Assign queue to counter
// @route   PUT /api/counters/:id/assign-queue
// @access  Private (Staff/Admin)
export const assignQueueToCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queueId } = req.body;
    const counterId = req.params.id;

    const counter = await Counter.findById(counterId);
    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    // Check if counter is available
    if (counter.status !== 'available') {
      res.status(400).json({
        success: false,
        error: 'Counter is not available'
      } as ApiResponse);
      return;
    }

    const queue = await Queue.findById(queueId);
    if (!queue) {
      res.status(404).json({
        success: false,
        error: 'Queue not found'
      } as ApiResponse);
      return;
    }

    // Check if queue service is supported by counter
    const serviceSupported = counter.services.some(
      (serviceId) => serviceId.toString() === queue.service.toString()
    );

    if (!serviceSupported) {
      res.status(400).json({
        success: false,
        error: 'Counter does not support this service'
      } as ApiResponse);
      return;
    }

    // Update counter and queue
    counter.currentQueue = queue._id;
    counter.status = CounterStatus.BUSY;
    await counter.save();

    queue.status = QueueStatus.IN_PROGRESS;
    queue.actualStartTime = new Date();
    await queue.save();

    res.status(200).json({
      success: true,
      message: 'Queue assigned to counter successfully',
      data: {
        counter,
        queue
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Complete current queue at counter
// @route   PUT /api/counters/:id/complete-queue
// @access  Private (Staff/Admin)
export const completeQueueAtCounter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counter = await Counter.findById(req.params.id);

    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    if (!counter.currentQueue) {
      res.status(400).json({
        success: false,
        error: 'No active queue at this counter'
      } as ApiResponse);
      return;
    }

    const queue = await Queue.findById(counter.currentQueue);
    if (queue) {
      queue.status = QueueStatus.COMPLETED;
      queue.actualEndTime = new Date();
      await queue.save();
    }

    // Clear counter's current queue and set to available
    counter.currentQueue = undefined;
    counter.status = CounterStatus.AVAILABLE;
    await counter.save();

    res.status(200).json({
      success: true,
      message: 'Queue completed successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get counter statistics
// @route   GET /api/counters/stats/overview
// @access  Private (Admin/Staff)
export const getCounterStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalCounters = await Counter.countDocuments();
    const availableCounters = await Counter.countDocuments({ status: 'available' });
    const busyCounters = await Counter.countDocuments({ status: 'busy' });
    const offlineCounters = await Counter.countDocuments({ status: 'offline' });

    res.status(200).json({
      success: true,
      data: {
        total: totalCounters,
        available: availableCounters,
        busy: busyCounters,
        offline: offlineCounters
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

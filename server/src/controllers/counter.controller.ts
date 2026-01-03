import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import Counter from '../models/Counter.model';
import QueueEntry from '../models/QueueEntry.model';

// @desc    Get all counters
// @route   GET /api/counters
// @access  Private (Admin/Staff)
export const getCounters = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const counters = await Counter.find(query)
      .populate('services', 'name duration')
      .populate('staffAssigned', 'name email')
      .populate('currentQueue', 'name status')
      .sort({ counterNumber: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Counter.countDocuments(query);

    res.status(200).json({
      success: true,
      data: counters,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: counters.length,
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

// @desc    Get single counter
// @route   GET /api/counters/:id
// @access  Private
export const getCounter = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const counter = await Counter.findById(req.params.id)
      .populate('services', 'name duration price')
      .populate('staffAssigned', 'name email phone')
      .populate('currentQueue', 'name status currentCount');

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

// @desc    Create counter
// @route   POST /api/counters
// @access  Private (Admin)
export const createCounter = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { counterNumber, name, description, services, status, staffAssigned } =
      req.body;

    // Check if counter number already exists
    const existingCounter = await Counter.findOne({ counterNumber });
    if (existingCounter) {
      res.status(400).json({
        success: false,
        error: 'Counter with this number already exists'
      } as ApiResponse);
      return;
    }

    const counter = await Counter.create({
      counterNumber,
      name,
      description,
      services,
      status,
      staffAssigned
    });

    res.status(201).json({
      success: true,
      message: 'Counter created successfully',
      data: counter
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
// @access  Private (Admin)
export const updateCounter = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { counterNumber, name, description, services, status, staffAssigned } =
      req.body;

    const counter = await Counter.findById(req.params.id);
    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    // Check if new counter number conflicts
    if (counterNumber && counterNumber !== counter.counterNumber) {
      const existing = await Counter.findOne({ counterNumber });
      if (existing) {
        res.status(400).json({
          success: false,
          error: 'Counter number already in use'
        } as ApiResponse);
        return;
      }
    }

    const updatedCounter = await Counter.findByIdAndUpdate(
      req.params.id,
      { counterNumber, name, description, services, status, staffAssigned },
      { new: true, runValidators: true }
    );

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
// @access  Private (Admin)
export const deleteCounter = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    // Check if counter has active queue entries
    const activeEntries = await QueueEntry.countDocuments({
      counter: counter._id,
      status: { $in: ['waiting', 'called', 'in_service'] }
    });

    if (activeEntries > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete counter with active queue entries'
      } as ApiResponse);
      return;
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

// @desc    Update counter status
// @route   PATCH /api/counters/:id/status
// @access  Private (Admin/Staff)
export const updateCounterStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const counter = await Counter.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Counter status updated successfully',
      data: counter
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get counter statistics
// @route   GET /api/counters/:id/stats
// @access  Private (Admin/Staff)
export const getCounterStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const counterId = req.params.id;

    const counter = await Counter.findById(counterId);
    if (!counter) {
      res.status(404).json({
        success: false,
        error: 'Counter not found'
      } as ApiResponse);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's statistics
    const todayStats = await QueueEntry.aggregate([
      {
        $match: {
          counter: counter._id,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalServed = await QueueEntry.countDocuments({
      counter: counter._id,
      status: 'completed',
      createdAt: { $gte: today }
    });

    const avgServiceTime = await QueueEntry.aggregate([
      {
        $match: {
          counter: counter._id,
          status: 'completed',
          startedAt: { $exists: true },
          completedAt: { $exists: true },
          createdAt: { $gte: today }
        }
      },
      {
        $project: {
          serviceTime: {
            $divide: [
              { $subtract: ['$completedAt', '$startedAt'] },
              1000 * 60
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$serviceTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        counter: {
          _id: counter._id,
          name: counter.name,
          counterNumber: counter.counterNumber,
          status: counter.status
        },
        today: {
          totalServed,
          averageServiceTime: avgServiceTime[0]?.avgTime || 0,
          byStatus: todayStats
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

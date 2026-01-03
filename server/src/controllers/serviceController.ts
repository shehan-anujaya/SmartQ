import { Response } from 'express';
import Service from '../models/Service';
import { AuthRequest, ApiResponse } from '../types';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        services,
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

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
export const getService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: service
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private (Admin/Staff)
export const createService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, duration, price, category, status } = req.body;

    const service = await Service.create({
      name,
      description,
      duration,
      price,
      category,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin/Staff)
export const updateService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
export const deleteService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories/list
// @access  Public
export const getCategories = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await Service.distinct('category');

    res.status(200).json({
      success: true,
      data: categories
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

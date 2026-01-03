import { Response } from 'express';
import Appointment from '../models/Appointment';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, AppointmentStatus } from '../types';

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (Admin/Staff)
export const getAppointments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const appointments = await Appointment.find(filter)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration price')
      .populate('staffAssigned', 'name email')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        appointments,
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

// @desc    Get my appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (Customer)
export const getMyAppointments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const appointments = await Appointment.find({ customer: req.user?.userId })
      .populate('service', 'name duration price')
      .populate('staffAssigned', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('service', 'name description duration price')
      .populate('staffAssigned', 'name email');

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: appointment
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Customer)
export const createAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { service, appointmentDate, appointmentTime, notes } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      } as ApiResponse);
      return;
    }

    // Check if appointment date is in the past
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Appointment date cannot be in the past'
      } as ApiResponse);
      return;
    }

    // Check if user already has appointment at this time
    const existingAppointment = await Appointment.findOne({
      customer: req.user?.userId,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      status: {
        $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
      }
    });

    if (existingAppointment) {
      res.status(400).json({
        success: false,
        error: 'You already have an appointment at this time'
      } as ApiResponse);
      return;
    }

    // Create appointment
    const appointment = await Appointment.create({
      customer: req.user?.userId,
      service,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      notes,
      status: AppointmentStatus.SCHEDULED
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('service', 'name duration price');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (Customer - own, Admin/Staff - any)
export const updateAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      } as ApiResponse);
      return;
    }

    // Check authorization
    if (
      appointment.customer.toString() !== req.user?.userId &&
      !['admin', 'staff'].includes(req.user?.role || '')
    ) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this appointment'
      } as ApiResponse);
      return;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('customer', 'name email phone')
      .populate('service', 'name duration price')
      .populate('staffAssigned', 'name email');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin/Staff)
export const updateAppointmentStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name email phone')
      .populate('service', 'name duration')
      .populate('staffAssigned', 'name');

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Customer - own, Admin/Staff - any)
export const cancelAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      } as ApiResponse);
      return;
    }

    // Check authorization
    if (
      appointment.customer.toString() !== req.user?.userId &&
      !['admin', 'staff'].includes(req.user?.role || '')
    ) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this appointment'
      } as ApiResponse);
      return;
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats/overview
// @access  Private (Admin/Staff)
export const getAppointmentStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const totalScheduled = await Appointment.countDocuments({
      status: AppointmentStatus.SCHEDULED
    });
    const totalConfirmed = await Appointment.countDocuments({
      status: AppointmentStatus.CONFIRMED
    });
    const totalCompleted = await Appointment.countDocuments({
      status: AppointmentStatus.COMPLETED
    });
    const totalCancelled = await Appointment.countDocuments({
      status: AppointmentStatus.CANCELLED
    });

    res.status(200).json({
      success: true,
      data: {
        scheduled: totalScheduled,
        confirmed: totalConfirmed,
        completed: totalCompleted,
        cancelled: totalCancelled,
        total: totalScheduled + totalConfirmed + totalCompleted + totalCancelled
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    } as ApiResponse);
  }
};

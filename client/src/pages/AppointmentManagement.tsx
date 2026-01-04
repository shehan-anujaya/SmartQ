import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getAppointments, updateAppointmentStatus } from '../store/slices/appointmentSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import { FiCalendar, FiUser, FiCheck, FiX, FiRefreshCw, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { AppointmentStatus } from '../types';

const AppointmentManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments, loading, stats } = useAppSelector((state) => state.appointments);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const fetchAppointments = () => {
    const params: any = { limit: 50 };
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    dispatch(getAppointments(params));
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    await dispatch(updateAppointmentStatus({ id: appointmentId, status: newStatus }));
    fetchAppointments();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      scheduled: 'info',
      confirmed: 'success',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
      no_show: 'danger'
    };
    return variants[status] || 'info';
  };

  const getActionButtons = (appointment: any) => {
    switch (appointment.status) {
      case 'scheduled':
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleStatusChange(appointment._id, AppointmentStatus.CONFIRMED)}
            >
              <FiCheck className="mr-1" /> Confirm
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleStatusChange(appointment._id, AppointmentStatus.CANCELLED)}
            >
              <FiX className="mr-1" /> Cancel
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleStatusChange(appointment._id, AppointmentStatus.IN_PROGRESS)}
            >
              Start
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleStatusChange(appointment._id, AppointmentStatus.NO_SHOW)}
            >
              No Show
            </Button>
          </div>
        );
      case 'in_progress':
        return (
          <Button
            size="sm"
            onClick={() => handleStatusChange(appointment._id, AppointmentStatus.COMPLETED)}
          >
            <FiCheck className="mr-1" /> Complete
          </Button>
        );
      default:
        return null;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
            <p className="text-gray-600 mt-1">
              View and manage all scheduled appointments
            </p>
          </div>
          <Button onClick={fetchAppointments} variant="secondary">
            <FiRefreshCw className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.scheduled || 0}</p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === 'in_progress').length}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.completed || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-600">{stats?.total || 0}</p>
            <p className="text-sm text-gray-600">Total</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              label="Filter by Date"
              type="date"
              name="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48"
            />
            <Select
              label="Status"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              className="w-full sm:w-48"
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setDateFilter(todayStr)}
              >
                Today
              </Button>
            </div>
          </div>
        </Card>

        {/* Appointments List */}
        {loading ? (
          <Loading />
        ) : appointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FiCalendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No appointments found</p>
              <p className="text-gray-400 text-sm">
                Adjust filters or check back later
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-primary-700" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.customer?.name || 'Customer'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.customer?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.service?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.service?.duration} mins • ${appointment.service?.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiCalendar className="mr-2 text-gray-400" />
                          {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock className="mr-2 text-gray-400" />
                          {appointment.appointmentTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadge(appointment.status)}>
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {getActionButtons(appointment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AppointmentManagement;

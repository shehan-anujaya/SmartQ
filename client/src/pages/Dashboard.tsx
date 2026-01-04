import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { getServices } from '../store/slices/serviceSlice';
import { getMyQueues, getQueueStats } from '../store/slices/queueSlice';
import { getMyAppointments, getAppointmentStats } from '../store/slices/appointmentSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { RootState } from '../store';
import { Appointment } from '../types';
import { FiCalendar, FiClock, FiCheckCircle, FiUsers } from 'react-icons/fi';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { myQueues, stats: queueStats, loading: queueLoading } = useAppSelector((state: RootState) => state.queues);
  const { myAppointments, stats: appointmentStats, loading: appointmentLoading } = useAppSelector(
    (state: RootState) => state.appointments
  );

  useEffect(() => {
    if (user?.role === 'customer') {
      dispatch(getMyQueues());
      dispatch(getMyAppointments());
    } else {
      dispatch(getQueueStats());
      dispatch(getAppointmentStats());
    }
    dispatch(getServices({ status: 'active', limit: 5 }));
  }, [dispatch, user?.role]);

  const isLoading = queueLoading || appointmentLoading;

  const stats = user?.role === 'customer'
    ? [
        {
          label: 'My Appointments',
          value: myAppointments.length,
          icon: FiCalendar,
          color: 'bg-blue-500'
        },
        {
          label: 'Active Queues',
          value: myQueues.filter(q => q.status === 'waiting' || q.status === 'in_progress').length,
          icon: FiClock,
          color: 'bg-green-500'
        },
        {
          label: 'Completed',
          value: myQueues.filter(q => q.status === 'completed').length,
          icon: FiCheckCircle,
          color: 'bg-purple-500'
        }
      ]
    : [
        {
          label: 'Total Queues',
          value: queueStats?.total || 0,
          icon: FiUsers,
          color: 'bg-blue-500'
        },
        {
          label: 'Waiting',
          value: queueStats?.waiting || 0,
          icon: FiClock,
          color: 'bg-yellow-500'
        },
        {
          label: 'In Progress',
          value: queueStats?.inProgress || 0,
          icon: FiClock,
          color: 'bg-green-500'
        },
        {
          label: 'Appointments',
          value: appointmentStats?.total || 0,
          icon: FiCalendar,
          color: 'bg-purple-500'
        }
      ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your {user?.role === 'customer' ? 'appointments' : 'queue management'} today.
          </p>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              {user?.role === 'customer' ? (
                <>
                  <a
                    href="/appointments/create"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Book Appointment</h3>
                    <p className="text-sm text-gray-600 mt-1">Schedule a new appointment</p>
                  </a>
                  <a
                    href="/queue/join"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Join Queue</h3>
                    <p className="text-sm text-gray-600 mt-1">Get in line for a service</p>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/queue"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Manage Queue</h3>
                    <p className="text-sm text-gray-600 mt-1">View and manage current queue</p>
                  </a>
                  <a
                    href="/appointments"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">View Appointments</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage all appointments</p>
                  </a>
                </>
              )}
            </div>
          </Card>

          <Card title="Recent Activity">
            {user?.role === 'customer' ? (
              <div className="space-y-3">
                {myAppointments.slice(0, 3).length > 0 ? (
                  myAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">{appointment.service.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                        {appointment.appointmentTime}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent appointments</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">Queue and appointment activity will appear here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getQueues, updateQueueStatus } from '../store/slices/queueSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import { FiClock, FiUser, FiPlay, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import { QueueStatus } from '../types';

const QueueManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { queues, loading, stats } = useAppSelector((state) => state.queues);
  const [statusFilter, setStatusFilter] = useState<string>('waiting');
  const [refreshInterval, setRefreshInterval] = useState<number>(30);

  const fetchQueues = () => {
    dispatch(getQueues({ status: statusFilter as QueueStatus, limit: 50 }));
  };

  useEffect(() => {
    fetchQueues();
    
    // Auto-refresh
    const interval = setInterval(fetchQueues, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [statusFilter, refreshInterval]);

  const handleStatusChange = async (queueId: string, newStatus: QueueStatus) => {
    await dispatch(updateQueueStatus({ id: queueId, status: newStatus }));
    fetchQueues();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      waiting: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
      no_show: 'danger'
    };
    return variants[status] || 'info';
  };

  const getActionButtons = (queue: any) => {
    switch (queue.status) {
      case 'waiting':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleStatusChange(queue._id, QueueStatus.IN_PROGRESS)}
            >
              <FiPlay className="mr-1" /> Start
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleStatusChange(queue._id, QueueStatus.CANCELLED)}
            >
              <FiX className="mr-1" /> Cancel
            </Button>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleStatusChange(queue._id, QueueStatus.COMPLETED)}
            >
              <FiCheck className="mr-1" /> Complete
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleStatusChange(queue._id, QueueStatus.NO_SHOW)}
            >
              No Show
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const inProgressQueues = queues.filter(q => q.status === 'in_progress');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and process customer queues in real-time
            </p>
          </div>
          <Button onClick={fetchQueues} variant="secondary">
            <FiRefreshCw className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.waiting || waitingQueues.length}</p>
            <p className="text-sm text-gray-600">Waiting</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.inProgress || inProgressQueues.length}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.completed || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-gray-600">{stats?.total || 0}</p>
            <p className="text-sm text-gray-600">Total Today</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select
              label="Status Filter"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              className="w-full sm:w-48"
            />
            <Select
              label="Auto Refresh"
              name="refreshInterval"
              value={refreshInterval.toString()}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              options={[
                { value: '10', label: 'Every 10s' },
                { value: '30', label: 'Every 30s' },
                { value: '60', label: 'Every 1min' }
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {/* Queue List */}
        {loading ? (
          <Loading />
        ) : queues.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FiClock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No queues found</p>
              <p className="text-gray-400 text-sm">Queues will appear here when customers join</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Currently Serving */}
            {inProgressQueues.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FiPlay className="mr-2 text-blue-600" />
                  Currently Serving ({inProgressQueues.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressQueues.map((queue) => (
                    <Card key={queue._id} className="border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-gray-900">
                              #{queue.queueNumber}
                            </span>
                            <Badge variant={getStatusBadge(queue.status)}>
                              {queue.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mt-1">
                            <FiUser className="inline mr-1" />
                            {queue.customer?.name || 'Customer'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {queue.service?.name} • {queue.service?.duration} mins
                          </p>
                          {queue.actualStartTime && (
                            <p className="text-sm text-blue-600 mt-2">
                              Started: {format(new Date(queue.actualStartTime), 'HH:mm')}
                            </p>
                          )}
                        </div>
                        {getActionButtons(queue)}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting */}
            {waitingQueues.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FiClock className="mr-2 text-yellow-600" />
                  Waiting ({waitingQueues.length})
                </h2>
                <div className="space-y-3">
                  {waitingQueues.map((queue, index) => (
                    <Card key={queue._id} className="border-l-4 border-yellow-500">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-gray-900">
                              #{queue.queueNumber}
                            </span>
                            <p className="text-xs text-gray-500">Position {index + 1}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {queue.customer?.name || 'Customer'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {queue.service?.name} • {queue.service?.duration} mins
                            </p>
                            <p className="text-sm text-gray-400">
                              Joined: {format(new Date(queue.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Est. Time</p>
                            <p className="font-medium text-gray-900">
                              {format(new Date(queue.estimatedTime), 'HH:mm')}
                            </p>
                          </div>
                          {getActionButtons(queue)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QueueManagement;

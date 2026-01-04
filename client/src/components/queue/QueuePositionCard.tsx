import React, { useEffect, useState } from 'react';
import { FiClock, FiHash, FiUser, FiCheckCircle } from 'react-icons/fi';
import { Queue, QueueStatus } from '../../types';
import Badge from '../common/Badge';

interface QueuePositionCardProps {
  queue: Queue;
  position: number;
}

const QueuePositionCard: React.FC<QueuePositionCardProps> = ({ queue, position }) => {
  const [timeWaiting, setTimeWaiting] = useState<string>('');

  useEffect(() => {
    const calculateWaitTime = () => {
      const created = new Date(queue.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        setTimeWaiting(`${diffMins} min`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeWaiting(`${hours}h ${mins}m`);
      }
    };

    calculateWaitTime();
    const interval = setInterval(calculateWaitTime, 60000);
    return () => clearInterval(interval);
  }, [queue.createdAt]);

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING:
        return 'border-yellow-400 bg-yellow-50';
      case QueueStatus.IN_PROGRESS:
        return 'border-blue-400 bg-blue-50';
      case QueueStatus.COMPLETED:
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
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

  return (
    <div className={`rounded-xl border-2 ${getStatusColor(queue.status)} p-6 transition-all hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <FiHash className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Queue Number</p>
            <p className="text-3xl font-bold text-gray-900">#{queue.queueNumber}</p>
          </div>
        </div>
        <Badge variant={getStatusBadge(queue.status)} className="text-sm">
          {queue.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center">
            <FiUser className="mr-1" /> Position
          </p>
          <p className="text-2xl font-bold text-primary-600">
            {queue.status === QueueStatus.IN_PROGRESS ? 'Now Serving' : `#${position}`}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center">
            <FiClock className="mr-1" /> Wait Time
          </p>
          <p className="text-2xl font-bold text-gray-700">{timeWaiting}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service</span>
          <span className="font-medium text-gray-900">{queue.service?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Est. Time</span>
          <span className="font-medium text-gray-900">
            {new Date(queue.estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {queue.status === QueueStatus.IN_PROGRESS && (
        <div className="mt-4 p-3 bg-blue-100 rounded-lg text-center">
          <p className="text-blue-800 font-semibold flex items-center justify-center">
            <FiCheckCircle className="mr-2" />
            You're being served now!
          </p>
        </div>
      )}
    </div>
  );
};

export default QueuePositionCard;

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getMyQueues, joinQueue, cancelQueue } from '../store/slices/queueSlice';
import { getServices } from '../store/slices/serviceSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import QueuePositionCard from '../components/queue/QueuePositionCard';
import { RootState } from '../store';
import { Queue as QueueType, Service } from '../types';
import { format } from 'date-fns';
import { FiRefreshCw } from 'react-icons/fi';

const Queue: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myQueues, loading } = useAppSelector((state) => state.queues);
  const { services } = useAppSelector((state) => state.services);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    notes: ''
  });

  useEffect(() => {
    dispatch(getMyQueues());
    dispatch(getServices({ status: 'active' }));
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      dispatch(getMyQueues());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(joinQueue(formData));
    if (joinQueue.fulfilled.match(result)) {
      setIsModalOpen(false);
      setFormData({
        service: '',
        notes: ''
      });
      dispatch(getMyQueues());
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to leave this queue?')) {
      await dispatch(cancelQueue(id));
      dispatch(getMyQueues());
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

  const activeQueues = myQueues.filter(q => q.status === 'waiting' || q.status === 'in_progress');
  const pastQueues = myQueues.filter(q => q.status === 'completed' || q.status === 'cancelled');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Queue</h1>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => dispatch(getMyQueues())}>
              <FiRefreshCw className="mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              Join Queue
            </Button>
          </div>
        </div>

        {/* Active Queues */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Queues</h2>
          {loading ? (
            <Loading />
          ) : activeQueues.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Not in any queue</p>
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  Join a Queue
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeQueues.map((queue, index) => (
                <div key={queue._id} className="space-y-4">
                  <QueuePositionCard queue={queue} position={index + 1} />
                  {queue.status === 'waiting' && (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => handleCancel(queue._id)}
                    >
                      Leave Queue
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Queues */}
        {pastQueues.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Queues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastQueues.map((queue) => (
                <Card key={queue._id} className="opacity-75">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Queue #{queue.queueNumber}
                        </h3>
                        <p className="text-sm text-gray-600">{queue.service.name}</p>
                      </div>
                      <Badge variant={getStatusBadge(queue.status)}>
                        {queue.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {format(new Date(queue.createdAt), 'MMM dd, yyyy')}
                      </p>
                      {queue.actualEndTime && (
                        <p>
                          <span className="font-medium">Completed:</span>{' '}
                          {format(new Date(queue.actualEndTime), 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Join Queue"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              options={services.map(s => ({ value: s._id, label: `${s.name} (${s.duration} mins)` }))}
              required
            />

            <Textarea
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements"
            />

            <div className="flex space-x-3">
              <Button type="submit" fullWidth isLoading={loading}>
                Join Queue
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Queue;

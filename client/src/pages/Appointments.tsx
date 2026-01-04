import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getMyAppointments, createAppointment, cancelAppointment } from '../store/slices/appointmentSlice';
import { getServices } from '../store/slices/serviceSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import AIBookingSuggestions from '../components/ai/AIBookingSuggestions';
import { format } from 'date-fns';
import { RootState } from '../store';
import { Appointment, Service } from '../types';

const Appointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myAppointments, loading } = useAppSelector((state: RootState) => state.appointments);
  const { services } = useAppSelector((state: RootState) => state.services);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  useEffect(() => {
    dispatch(getMyAppointments());
    dispatch(getServices({ status: 'active' }));
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createAppointment(formData));
    if (createAppointment.fulfilled.match(result)) {
      setIsModalOpen(false);
      setFormData({
        service: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
      dispatch(getMyAppointments());
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await dispatch(cancelAppointment(id));
      dispatch(getMyAppointments());
    }
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

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            Book Appointment
          </Button>
        </div>

        {loading ? (
          <Loading />
        ) : myAppointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No appointments yet</p>
              <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                Book Your First Appointment
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAppointments.map((appointment: Appointment) => (
              <Card key={appointment._id}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {appointment.service.name}
                    </h3>
                    <Badge variant={getStatusBadge(appointment.status)}>
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {appointment.appointmentTime}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span> {appointment.service.duration} mins
                    </p>
                    <p>
                      <span className="font-medium">Price:</span> ${appointment.service.price}
                    </p>
                    {appointment.notes && (
                      <p>
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>

                  {appointment.status === 'scheduled' && (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => handleCancel(appointment._id)}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Book New Appointment"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              options={services.map((s: Service) => ({ value: s._id, label: `${s.name} - $${s.price} (${s.duration} mins)` }))}
              required
            />

            <Input
              label="Date"
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              min={minDate}
              required
            />

            <Input
              label="Time"
              type="time"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
              required
            />

            {/* AI Booking Suggestions */}
            {formData.service && formData.appointmentDate && (
              <AIBookingSuggestions
                serviceId={formData.service}
                selectedDate={formData.appointmentDate}
                onSelectSlot={(time) => setFormData({ ...formData, appointmentTime: time })}
              />
            )}

            <Textarea
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements or notes"
            />

            <div className="flex space-x-3">
              <Button type="submit" fullWidth isLoading={loading}>
                Book Appointment
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

export default Appointments;

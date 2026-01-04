import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getServices, createService, updateService, deleteService } from '../store/slices/serviceSlice';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiClock } from 'react-icons/fi';
import { Service, ServiceStatus } from '../types';

const Services: React.FC = () => {
  const dispatch = useAppDispatch();
  const { services, loading } = useAppSelector((state) => state.services);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    status: 'active'
  });

  useEffect(() => {
    dispatch(getServices({}));
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      category: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration.toString(),
      price: service.price.toString(),
      category: service.category,
      status: service.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      category: formData.category,
      status: formData.status as ServiceStatus
    };

    if (editingService) {
      await dispatch(updateService({ id: editingService._id, data: serviceData }));
    } else {
      await dispatch(createService(serviceData));
    }

    setIsModalOpen(false);
    dispatch(getServices({}));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await dispatch(deleteService(id));
      dispatch(getServices({}));
    }
  };

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Manage your service offerings</p>
          </div>
          <Button onClick={openCreateModal}>
            <FiPlus className="mr-2" />
            Add Service
          </Button>
        </div>

        {loading ? (
          <Loading />
        ) : services.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services yet</p>
              <Button className="mt-4" onClick={openCreateModal}>
                Create Your First Service
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                    <Badge variant={service.status === 'active' ? 'success' : 'danger'}>
                      {service.status}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <FiClock className="mr-1" />
                      {service.duration} mins
                    </div>
                    <div className="flex items-center text-green-600 font-semibold">
                      <FiDollarSign className="mr-1" />
                      {service.price}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(service)}
                      className="flex-1"
                    >
                      <FiEdit2 className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(service._id)}
                      className="flex-1"
                    >
                      <FiTrash2 className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? 'Edit Service' : 'Create New Service'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Service Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Haircut, Consultation"
              required
            />

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the service..."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="5"
                placeholder="30"
                required
              />

              <Input
                label="Price ($)"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="25.00"
                required
              />
            </div>

            <Input
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Hair, Nails, Spa"
              list="categories"
              required
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              required
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" fullWidth isLoading={loading}>
                {editingService ? 'Update Service' : 'Create Service'}
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

export default Services;

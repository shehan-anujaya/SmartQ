import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import {
  FiHome,
  FiCalendar,
  FiClock,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiBarChart2,
  FiGrid,
  FiX
} from 'react-icons/fi';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const customerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/appointments', label: 'My Appointments', icon: FiCalendar },
    { to: '/queue', label: 'Queue Status', icon: FiClock },
  ];

  const staffLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/queue/manage', label: 'Manage Queue', icon: FiClock },
    { to: '/appointments/manage', label: 'Appointments', icon: FiCalendar },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { to: '/queue/manage', label: 'Queue Management', icon: FiClock },
    { to: '/appointments/manage', label: 'Appointments', icon: FiCalendar },
    { to: '/services', label: 'Services', icon: FiGrid },
    { to: '/users', label: 'User Management', icon: FiUsers },
  ];

  const getNavLinks = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return adminLinks;
      case UserRole.STAFF:
        return staffLinks;
      default:
        return customerLinks;
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SmartQ</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

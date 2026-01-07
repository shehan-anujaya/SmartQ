import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import {
  FiHome,
  FiCalendar,
  FiClock,
  FiUsers,
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
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="text-xl font-bold text-slate-900">SmartQ</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <link.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-primary-600 font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all duration-200"
            >
              <FiLogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

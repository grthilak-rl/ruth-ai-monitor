import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import UserProfileDropdown from './UserProfileDropdown';
import AlertNotificationBadge from './AlertNotificationBadge';
import { useAlerts } from '../../contexts/AlertContext';

const NavigationHeader = ({ user, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alertCount } = useAlerts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: 'Monitor',
      tooltip: 'Real-time camera feeds and violation alerts'
    },
    {
      label: 'Analytics',
      path: '/analytics-reports',
      icon: 'BarChart3',
      tooltip: 'Historical data visualization and compliance reporting'
    },
    {
      label: 'Violations',
      path: '/violation-history',
      icon: 'History',
      tooltip: 'Detailed violation investigation and incident management'
    },
    {
      label: 'Cameras',
      path: '/camera-management',
      icon: 'Camera',
      tooltip: 'Administrative camera configuration and AI model assignment'
    },
    {
      label: 'AI Chat',
      path: '/ai-chat-assistance',
      icon: 'Bot',
      tooltip: 'AI-powered chat assistance for safety inquiries'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-card border-b border-border">
      <div className="flex items-center justify-between h-[60px] px-4 lg:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-md">
            <Icon name="Shield" size={20} color="var(--color-primary-foreground)" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground leading-none">
              Industrial Safety Monitor
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              v1.1.0
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems?.map((item) => (
            <button
              key={item?.path}
              onClick={() => handleNavigation(item?.path)}
              className={`
                relative flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-150 ease-industrial
                ${isActive(item?.path)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
              title={item?.tooltip}
            >
              <Icon name={item?.icon} size={16} />
              <span>{item?.label}</span>
              {item?.path === '/live-monitoring-dashboard' && alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-error rounded-full">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          <AlertNotificationBadge count={alertCount} onAlertClick={() => handleNavigation('/violation-history')} />
          <UserProfileDropdown user={user} />
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
          </button>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border shadow-lg">
          <nav className="px-4 py-2 space-y-1">
            {navigationItems?.map((item) => (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium text-left
                  transition-all duration-150 ease-industrial
                  ${isActive(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon name={item?.icon} size={18} />
                <span>{item?.label}</span>
                {item?.path === '/live-monitoring-dashboard' && alertCount > 0 && (
                  <span className="ml-auto flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-error rounded-full">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavigationHeader;
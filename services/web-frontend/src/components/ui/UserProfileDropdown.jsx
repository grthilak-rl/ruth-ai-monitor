import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import AppImage from '../AppImage';

const UserProfileDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const defaultUser = {
    name: 'Safety Manager',
    email: 'manager@industrial-safety.com',
    role: 'Safety Supervisor',
    avatar: '/assets/images/default-avatar.png',
    lastLogin: '2025-08-31 15:45:00'
  };

  const currentUser = user || defaultUser;

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: 'User',
      path: '/user-profile-settings',
      description: 'Manage account and preferences'
    },
    {
      label: 'System Status',
      icon: 'Activity',
      action: 'status',
      description: 'View system health and performance'
    },
    {
      label: 'Help & Support',
      icon: 'HelpCircle',
      action: 'help',
      description: 'Documentation and support resources'
    },
    {
      type: 'divider'
    },
    {
      label: 'Sign Out',
      icon: 'LogOut',
      action: 'logout',
      description: 'Securely log out of the system',
      variant: 'destructive'
    }
  ];

  const handleItemClick = (item) => {
    setIsOpen(false);
    
    if (item?.path) {
      navigate(item?.path);
    } else if (item?.action) {
      switch (item?.action) {
        case 'logout':
          handleLogout();
          break;
        case 'status':
          // Handle system status view
          console.log('System status requested');
          break;
        case 'help':
          // Handle help documentation
          console.log('Help documentation requested');
          break;
        default:
          break;
      }
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    
    // Navigate to login
    navigate('/login');
  };

  const formatLastLogin = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event?.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-md hover:bg-muted transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          <AppImage
            src={currentUser?.avatar}
            alt={`${currentUser?.name} avatar`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-foreground leading-none">
            {currentUser?.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {currentUser?.role}
          </div>
        </div>
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`hidden lg:block text-muted-foreground transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-md shadow-lg z-[1010] animate-in fade-in-0 zoom-in-95">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                <AppImage
                  src={currentUser?.avatar}
                  alt={`${currentUser?.name} avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-popover-foreground truncate">
                  {currentUser?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentUser?.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center space-x-1">
                    <Icon name="Clock" size={12} />
                    <span>Last login: {formatLastLogin(currentUser?.lastLogin)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems?.map((item, index) => {
              if (item?.type === 'divider') {
                return <div key={index} className="h-px bg-border mx-2 my-2" />;
              }

              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 text-left
                    transition-colors duration-150 hover:bg-muted
                    ${item?.variant === 'destructive' ?'text-destructive hover:bg-destructive/10' :'text-popover-foreground'
                    }
                  `}
                >
                  <Icon 
                    name={item?.icon} 
                    size={16} 
                    className={item?.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item?.label}</div>
                    {item?.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item?.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
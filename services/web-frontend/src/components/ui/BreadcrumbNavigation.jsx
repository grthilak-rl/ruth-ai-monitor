import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BreadcrumbNavigation = ({ customBreadcrumbs }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeMap = {
    '/live-monitoring-dashboard': { label: 'Live Monitor', icon: 'Monitor' },
    '/camera-management': { label: 'Cameras', icon: 'Camera' },
    '/analytics-reports': { label: 'Analytics', icon: 'BarChart3' },
    '/violation-history': { label: 'History', icon: 'History' },
    '/user-profile-settings': { label: 'Profile', icon: 'User' },
    '/login': { label: 'Login', icon: 'LogIn' }
  };

  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location?.pathname?.split('/')?.filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/live-monitoring-dashboard', icon: 'Home' }];

    let currentPath = '';
    pathSegments?.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const route = routeMap?.[currentPath];
      
      if (route && currentPath !== '/live-monitoring-dashboard') {
        breadcrumbs?.push({
          label: route?.label,
          path: currentPath,
          icon: route?.icon,
          isLast: index === pathSegments?.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleBreadcrumbClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const handleBackClick = () => {
    if (breadcrumbs?.length > 1) {
      const previousBreadcrumb = breadcrumbs?.[breadcrumbs?.length - 2];
      navigate(previousBreadcrumb?.path);
    }
  };

  if (breadcrumbs?.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      {/* Mobile Back Button */}
      <button
        onClick={handleBackClick}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors duration-150"
        aria-label="Go back"
      >
        <Icon name="ArrowLeft" size={16} />
      </button>
      {/* Desktop Breadcrumb Trail */}
      <ol className="hidden md:flex items-center space-x-2">
        {breadcrumbs?.map((breadcrumb, index) => (
          <li key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <Icon name="ChevronRight" size={14} className="text-border" />
            )}
            
            {breadcrumb?.isLast ? (
              <span className="flex items-center space-x-1.5 text-foreground font-medium">
                <Icon name={breadcrumb?.icon} size={14} />
                <span>{breadcrumb?.label}</span>
              </span>
            ) : (
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb?.path)}
                className="flex items-center space-x-1.5 hover:text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
              >
                <Icon name={breadcrumb?.icon} size={14} />
                <span>{breadcrumb?.label}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
      {/* Mobile Current Page */}
      <div className="md:hidden flex items-center space-x-2">
        <Icon name={breadcrumbs?.[breadcrumbs?.length - 1]?.icon} size={16} />
        <span className="font-medium text-foreground">
          {breadcrumbs?.[breadcrumbs?.length - 1]?.label}
        </span>
      </div>
    </nav>
  );
};

export default BreadcrumbNavigation;
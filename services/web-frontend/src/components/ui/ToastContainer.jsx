import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AlertToast from './AlertToast';
import socketService from '../../utils/socketService';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  // Function to add a new toast
  const addToast = useCallback((toast) => {
    const id = `toast-${Date.now()}`;
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  // Function to remove a toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose methods to window for global access
  useEffect(() => {
    window.toastManager = {
      addToast,
      removeToast,
      // Helper methods for common toast types
      showViolationAlert: (violation) => {
        return addToast({
          title: `New ${violation.violationType} Detected`,
          message: `${violation.description} at ${violation.location}`,
          severity: violation.severity || 'high',
          duration: 8000,
          actionLabel: 'View Details',
          onAction: () => {
            // Navigate to violation details or open modal
            if (window.openViolationDetails) {
              window.openViolationDetails(violation.id);
            }
          }
        });
      },
      showSuccess: (message, title = 'Success') => {
        return addToast({
          title,
          message,
          severity: 'info',
          duration: 3000
        });
      },
      showError: (message, title = 'Error') => {
        return addToast({
          title,
          message,
          severity: 'critical',
          duration: 5000
        });
      }
    };

    return () => {
      delete window.toastManager;
      setToasts([]); // Clear all toasts on unmount
    };
  }, [addToast, removeToast]);

  // Initialize socket connection
  useEffect(() => {
    socketService.initialize();

    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Listen for server-sent events for new violations
  useEffect(() => {
    const setupViolationListener = () => {
      // In a real implementation, this would connect to a server-sent events endpoint
      // For demonstration, we'll simulate with a periodic check
      const checkInterval = setInterval(() => {
        // Simulate a random violation detection (1% chance)
        if (Math.random() < 0.01) {
          const mockViolation = {
            id: `v-${Date.now()}`,
            violationType: ['PPE Violation', 'Fall Detected', 'Fire Detected', 'Restricted Area'][Math.floor(Math.random() * 4)],
            description: 'Safety violation detected by AI monitoring system',
            location: ['Building A', 'Assembly Line', 'Warehouse', 'Loading Dock'][Math.floor(Math.random() * 4)],
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
          };

          window.toastManager.showViolationAlert(mockViolation);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(checkInterval);
    };

    // Wait for toast manager to be available
    const initTimer = setTimeout(() => {
      if (window.toastManager) {
        setupViolationListener();
      }
    }, 2000);

    return () => clearTimeout(initTimer);
  }, []);

  // Clear toasts on route change
  useEffect(() => {
    setToasts([]);
  }, [location.pathname]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
      {toasts.map(toast => (
        <AlertToast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          message={toast.message}
          severity={toast.severity}
          duration={toast.duration}
          onClose={removeToast}
          showProgress={toast.showProgress}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
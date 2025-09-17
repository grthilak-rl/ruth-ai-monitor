import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertCount, setAlertCount] = useState(0);

  const fetchAlertCount = async () => {
    try {
      const response = await axios.get('/violations/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setAlertCount(response.data.count);
      console.log('Fetched alert count:', response.data.count);
    } catch (error) {
      console.error('Failed to fetch alert count:', error);
      setAlertCount(0); // Reset count on error
    }
  };

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ alertCount, fetchAlertCount }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
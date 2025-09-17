import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Icon from '../../components/AppIcon';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import NavigationHeader from '../../components/ui/NavigationHeader';
import ViolationsSidebar from '../../components/ViolationsSidebar';
import CameraCarousel from '../../components/CameraCarousel';
import MetricsCard from '../analytics-reports/components/MetricsCard';
import socketService from '../../utils/socketService';

const LiveMonitoringDashboard = () => {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [safetyMetrics, setSafetyMetrics] = useState({
    metrics: [],
    violationTrend: [],
    categoryBreakdown: [],
  });
  const [safetyScoreBreakdown, setSafetyScoreBreakdown] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [cameras, setCameras] = useState([
    { id: 'cam1', name: 'Camera 1', location: 'Main Entrance', imageUrl: '/assets/images/placeholder.svg' },
    { id: 'cam2', name: 'Camera 2', location: 'Warehouse', imageUrl: '/assets/images/placeholder.svg' },
    { id: 'cam3', name: 'Camera 3', location: 'Loading Dock', imageUrl: '/assets/images/placeholder.svg' },
    { id: 'cam4', name: 'Camera 4', location: 'Parking Lot', imageUrl: '/assets/images/placeholder.svg' },
  ]);
  const [alertFilter, setAlertFilter] = useState('');
  const [mappedSafetyMetrics, setMappedSafetyMetrics] = useState([]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleViolationClick = (violation) => {
    setSelectedViolation(violation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedViolation(null);
  };

  const fetchViolations = useCallback(async () => {
    try {
      const response = await axios.get('/violations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setViolations(response.data);
    } catch (error) {
      console.error('Failed to fetch violations:', error);
    }
  }, []);

  const handleMetricClick = (metricId) => {
    console.log(`Metric clicked: ${metricId}`);
    // Implement navigation or detailed view for the metric
  };

  const handleStatusUpdate = async (violationId, newStatus) => {
    try {
      await axios.put(`/violations/${violationId}`, { status: newStatus }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      fetchViolations();
      if (selectedViolation && selectedViolation.id === violationId) {
        setSelectedViolation(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Failed to update violation status:', error);
    }
  };

  const handleNotesUpdate = async (violationId, newNotes) => {
    try {
      await axios.put(`/violations/${violationId}`, { notes: newNotes });
      fetchViolations();
      if (selectedViolation && selectedViolation.id === violationId) {
        setSelectedViolation(prev => ({ ...prev, notes: newNotes }));
      }
    } catch (error) {
      console.error('Failed to update violation notes:', error);
    }
  };

  const handleAcknowledgeAll = async () => {
    const token = localStorage.getItem('authToken');
    console.log('Auth Token before acknowledge-all API call:', token);
    if (!token) {
      console.error('Authentication token not found. Please log in.');
      return;
    }
    try {
      await axios.post('/violations/bulk-update', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchViolations();
      console.log('All violations acknowledged');
    } catch (error) {
      console.error('Failed to acknowledge all violations:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardResponse = await axios.get('/violations/stats');

        const { totalCameras, totalViolations, unresolvedViolations, safetyScore } = dashboardResponse.data;

        const transformedMetrics = [
          { id: 'totalViolations', title: 'Total Violations', value: totalViolations, icon: 'Gavel', color: 'text-yellow-500' },
          { id: 'unresolvedViolations', title: 'Unresolved Violations', value: unresolvedViolations, icon: 'AlertTriangle', color: 'text-red-500' },
          { id: 'totalCameras', title: 'Total Cameras', value: totalCameras, icon: 'Video', color: 'text-green-500' },
          { id: 'safetyScore', title: 'Overall Safety Score', value: safetyScore, icon: 'ShieldCheck', color: 'text-blue-500' },
        ];

        setMappedSafetyMetrics(transformedMetrics);

        const violationTrendData = trendsResponse.data.map(item => ({
          name: format(new Date(item.date), 'MMM dd'),
          violations: item.count,
        }));

        const categoryBreakdownData = Object.entries(violationsByTypeResponse.data).map(([type, count]) => ({
          name: type,
          value: count,
          fill: getRandomColor(),
        }));

        setSafetyMetrics({
          metrics: transformedMetrics,
          violationTrend: violationTrendData,
          categoryBreakdown: categoryBreakdownData,
        });

        setSafetyScoreBreakdown(dashboardResponse.data.safetyScoreBreakdown);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
    fetchViolations();
  }, [fetchViolations]);

  useEffect(() => {
    const listenerId = socketService.addEventListener('newViolation', (newViolation) => {
      setViolations((prevViolations) => [newViolation, ...prevViolations]);
    });

    return () => {
      socketService.removeEventListener('newViolation', listenerId);
    };
  }, []);

  return (
    <div>
      <NavigationHeader title="Live Monitoring Dashboard" />
      <div className="p-6 space-y-6 pt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {mappedSafetyMetrics.map((metric, index) => (
            <MetricsCard key={index} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Video" size={20} className="text-purple-500" />
                  <span>Live Camera Feed</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[300px]">
                <CameraCarousel cameras={cameras} currentCameraIndex={currentCameraIndex} setCurrentCameraIndex={setCurrentCameraIndex} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon name="LineChart" size={20} className="text-blue-500" />
                    <span>Violation Trends (Daily)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={safetyMetrics.violationTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="violations" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon name="PieChart" size={20} className="text-green-500" />
                    <span>Violation Category Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={safetyMetrics.categoryBreakdown}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ViolationsSidebar violations={violations} onViolationClick={handleViolationClick} onAcknowledgeAll={handleAcknowledgeAll} alertFilter={alertFilter} setAlertFilter={setAlertFilter} />
          </div>
        </div>
      </div>

      {selectedViolation && (
        <ViolationDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          violation={selectedViolation}
          onStatusUpdate={handleStatusUpdate}
          onNotesUpdate={handleNotesUpdate}
        />
      )}
    </div>
  );
};

export default LiveMonitoringDashboard;

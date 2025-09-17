import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import MetricsCard from './components/MetricsCard';
import DateRangeSelector from './components/DateRangeSelector';
import ViolationTrendChart from './components/ViolationTrendChart';
import CategoryBreakdownChart from './components/CategoryBreakdownChart';
import CameraPerformanceChart from './components/CameraPerformanceChart';
import HeatMapChart from './components/HeatMapChart';
import ExportToolbar from './components/ExportToolbar';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AnalyticsReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [metrics, setMetrics] = useState([]);
  const [violationTrend, setViolationTrend] = useState({});
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [cameraPerformance, setCameraPerformance] = useState({});
  const [heatMap, setHeatMap] = useState({});

  const mockBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Reports', href: '/analytics/reports', current: true }
  ];

  const handleNavigate = (path) => {
    console.log('Navigating to:', path);
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const authToken = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${authToken}` };
        const params = {
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate,
        };

        // Fetch Dashboard Metrics
        const metricsResponse = await axios.get('/violations/stats', { headers, params });
        setMetrics([
          {
            title: 'Total Violations',
            value: metricsResponse.data.totalViolations,
            icon: 'AlertTriangle',
            description: 'Total safety violations detected across all cameras in the selected period',
            change: metricsResponse.data.totalViolationsChange,
            changeType: metricsResponse.data.totalViolationsChangeType
          },
          {
            title: 'Unresolved Violations',
            value: metricsResponse.data.unresolvedViolations,
            icon: 'AlertCircle',
            description: 'Violations that are still pending or under investigation',
            change: metricsResponse.data.unresolvedViolationsChange,
            changeType: metricsResponse.data.unresolvedViolationsChangeType
          },
          {
            title: 'Total Cameras',
            value: metricsResponse.data.totalCameras,
            icon: 'Camera',
            description: 'Total active cameras in the system',
            change: metricsResponse.data.totalCamerasChange,
            changeType: metricsResponse.data.totalCamerasChangeType
          },
          {
            title: 'Recent Violations',
            value: metricsResponse.data.recentViolations.length,
            icon: 'Clock',
            description: 'Violations detected in the last 24 hours'
          }
        ]);

        // Fetch Violation Trend
        const trendResponse = await axios.get('/api/analytics/violations/trend', { headers, params });
        setViolationTrend(trendResponse.data);

        // Fetch Violations by Type (Category Breakdown)
        const categoryResponse = await axios.get('/api/analytics/by-type', { headers, params });
        setCategoryBreakdown(categoryResponse.data);

        // Fetch Violations by Location (for Camera Performance and Heatmap)
        console.log("Attempting to fetch violations by location...");
        const locationResponse = await axios.get('/api/analytics/by-location', { headers, params });
        console.log("Location Response Data:", locationResponse.data);
        setCameraPerformance(locationResponse.data);
        setHeatMap(locationResponse.data);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [customDateRange]); // Re-fetch data when customDateRange changes

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    // For simplicity, we are not updating filters state here, but directly using customDateRange
  };

  const handleExport = (type) => {
    setLoading(true);
    
    // Simulate export process
    setTimeout(() => {
      console.log(`Exporting ${type} report`);
      
      // Mock download trigger
      const fileName = `safety-report-${new Date()?.toISOString()?.split('T')?.[0]}.${type}`;
      console.log(`Downloaded: ${fileName}`);
      
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationHeader user={user} alertCount={0} onNavigate={handleNavigate} />
      <div className="container mx-auto p-6">
        <BreadcrumbNavigation paths={mockBreadcrumbs} />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Reports</h1>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Dashboard Metrics</h2>
                <DateRangeSelector
                  selectedRange={selectedDateRange}
                  onSelectRange={handleDateRangeChange}
                  onCustomRangeChange={setCustomDateRange}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {metrics.map((metric, index) => (
                  <MetricsCard key={index} {...metric} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ViolationTrendChart data={violationTrend} />
                <CategoryBreakdownChart data={categoryBreakdown} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CameraPerformanceChart data={cameraPerformance} />
                <HeatMapChart data={heatMap} />
              </div>
            </div>
          </div>
        </div>

        <ExportToolbar onExport={handleExport} />
      </div>
    </div>
  );
};

export default AnalyticsReports;
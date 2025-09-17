import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios'; // Add this line to import axios
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ViolationFilters from './components/ViolationFilters';
import ViolationStats from './components/ViolationStats';
import ViolationTable from './components/ViolationTable';
import BulkActions from './components/BulkActions';
import ViolationDetailsModal from './components/ViolationDetailsModal';
import Icon from '../../components/AppIcon';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const ViolationHistory = () => {
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [selectedViolations, setSelectedViolations] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    violationType: 'all',
    severity: 'all',
    status: 'all',
    cameraLocation: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchViolations = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      console.log("Auth Token:", authToken); // Add this line to log the auth token
      const response = await fetch(`/violations?timestamp=${new Date().getTime()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Authorization': `Bearer ${authToken}`, // Change this line to include the auth token with Bearer prefix
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched violations data:", data); // Add this line to log the data
      setViolations(data);
    } catch (error) {
      console.error("Error fetching violations:", error);
    }
  };

  // Initialize violations data
  useEffect(() => {
    fetchViolations();
  }, []);

  // Filter and sort violations
  const processedViolations = useMemo(() => {
    let filtered = violations?.filter(violation => {
      const matchesSearch = !filters?.search || 
        violation?.description?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        violation?.cameraLocation?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        violation?.investigator?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        violation?.id?.toLowerCase()?.includes(filters?.search?.toLowerCase());

      const matchesType = filters?.violationType === 'all' || violation?.violationType === filters?.violationType;
      const matchesSeverity = filters?.severity === 'all' || violation?.severity === filters?.severity;
      const matchesStatus = filters?.status === 'all' || violation?.status === filters?.status;
      const matchesLocation = filters?.cameraLocation === 'all' || violation?.cameraLocation === filters?.cameraLocation;

      const matchesDateFrom = !filters?.dateFrom || new Date(violation.timestamp) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters?.dateTo || new Date(violation.timestamp) <= new Date(filters.dateTo + 'T23:59:59');

      return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesLocation && matchesDateFrom && matchesDateTo;
    });

    // Sort violations
    if (sortConfig?.key) {
      filtered?.sort((a, b) => {
        let aValue = a?.[sortConfig?.key];
        let bValue = b?.[sortConfig?.key];

        if (sortConfig?.key === 'timestamp') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig?.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig?.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [violations, filters, sortConfig]);

  useEffect(() => {
    setFilteredViolations(processedViolations);
  }, [processedViolations]);

  // Calculate alert count for navigation
  const alertCount = violations?.filter(v => v?.status === 'new')?.length;

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedViolations([]); // Clear selection when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      violationType: 'all',
      severity: 'all',
      status: 'all',
      cameraLocation: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSelectedViolations([]);
  };

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const handleSelectionChange = (newSelection) => {
    setSelectedViolations(newSelection);
  };

  const handleStatusUpdate = async (violationId, updates) => {
    try {
      const response = await fetch(`/violations/${violationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setViolations(prev => prev?.map(violation => 
        violation?.id === violationId 
          ? { ...violation, ...updates }
          : violation
      ));
    } catch (error) {
      console.error("Error updating violation status:", error);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.put('/violations/bulk-update', {
        violationIds: selectedViolations,
        status
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setViolations(prev => prev?.map(violation => 
        selectedViolations?.includes(violation?.id)
          ? { ...violation, status }
          : violation
      ));
      setSelectedViolations([]);
    } catch (error) {
      console.error("Error bulk updating violation status:", error);
    }
  };


  const handleBulkExport = async (format) => {
    try {
      const authToken = localStorage.getItem('authToken');
      console.log('Selected Violations for Export:', selectedViolations);
      console.log('Export Format:', format);
      const response = await axios.post('/violations/export', {
        violationIds: selectedViolations,
        format
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Important for handling file downloads
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a blob from the response data
      const file = new Blob([response.data], { type: response.headers['content-type'] });

      // Create a link element and trigger the download
      const fileURL = URL.createObjectURL(file);
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'violations';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      } else if (format === 'csv') {
        fileName = 'violations.csv';
      } else if (format === 'pdf') {
        fileName = 'violations.pdf';
      } else if (format === 'excel') {
        fileName = 'violations.xlsx';
      }

      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL); // Clean up the URL object

      toast.success("Violations exported successfully!");
      setSelectedViolations([]);
    } catch (error) {
      console.error("Error bulk exporting violations:", error);
      toast.error("Failed to export violations.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.delete('/violations/bulk-update', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: { violationIds: selectedViolations } // Axios uses 'data' for DELETE body
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setViolations(prev => prev?.filter(violation => !selectedViolations?.includes(violation?.id)));
      setSelectedViolations([]);
      toast.success("Selected violations deleted successfully!");
    } catch (error) {
      console.error("Error bulk deleting violations:", error);
      toast.error("Failed to delete violations.");
    }
  };

  const handleOpenModal = (violation) => {
    setSelectedViolation(violation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedViolation(null);
  };

  const mockBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Violations', href: '/violations', current: true }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pt-[60px]">
      <NavigationHeader user={user} alertCount={alertCount} />
      <div className="container mx-auto p-6 flex flex-1">
        <ViolationFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <div className="flex-1 ml-6">
          <div className="flex items-center justify-between mb-4">
            <BreadcrumbNavigation paths={mockBreadcrumbs} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSidebar}
              iconName={isSidebarOpen ? "ChevronLeft" : "ChevronRight"}
              iconPosition="left"
            >
              {isSidebarOpen ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Violation History</h1>
          <ViolationStats violations={filteredViolations} filters={filters} onRefresh={fetchViolations} />
          <BulkActions
            selectedCount={selectedViolations?.length}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDelete}
          />
          <ViolationTable
            violations={filteredViolations}
            selectedViolations={selectedViolations}
            onSelectionChange={handleSelectionChange}
            onSort={handleSort}
            sortConfig={sortConfig}
            onViewDetails={handleOpenModal}
          />
        </div>
      </div>
      <ViolationDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        violation={selectedViolation}
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
};

export default ViolationHistory;
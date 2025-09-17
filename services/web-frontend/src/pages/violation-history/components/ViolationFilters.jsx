import React, { useState, useEffect } from 'react';
import Icon from '@/components/AppIcon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import axios from 'axios';

const ViolationFilters = ({ filters, onFiltersChange, onClearFilters, isSidebarOpen, onToggleSidebar }) => {
  const [cameraLocations, setCameraLocations] = useState([]);

  useEffect(() => {
    const fetchCameraLocations = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await axios.get('/cameras/cameras', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const locations = response.data.map(camera => ({ value: `${camera.location}-${camera.id}`, label: camera.location }));
        setCameraLocations([{ value: 'all', label: 'All Locations' }, ...locations]);
      } catch (error) {
        console.error("Error fetching camera locations:", error);
      }
    };
    fetchCameraLocations();
  }, []);

  const violationTypeOptions = [
    { value: 'all-violationType', label: 'All Types' },
    { value: 'ppe_missing', label: 'PPE Missing' },
    { value: 'fall_risk', label: 'Fall Risk' },
    { value: 'fire_hazard', label: 'Fire Hazard' },
    { value: 'smoke_detected', label: 'Smoke Detected' },
    { value: 'restricted_area', label: 'Restricted Area' },
    { value: 'unsafe_behavior', label: 'Unsafe Behavior' }
  ];

  const severityOptions = [
    { value: 'all-severity', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { value: 'all-status', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'false_positive', label: 'False Positive' }
  ];

  const cameraLocationOptions = cameraLocations;

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.search) count++;
    if (filters?.violationType !== 'all-violationType') count++;
    if (filters?.severity !== 'all-severity') count++;
    if (filters?.status !== 'all-status') count++;
    if (filters?.cameraLocation !== 'all') count++;
    if (filters?.dateFrom || filters?.dateTo) count++;
    return count;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-error text-white';
      case 'investigating': return 'bg-warning text-white';
      case 'reviewed': return 'bg-accent text-white';
      case 'resolved': return 'bg-success text-white';
      case 'false_positive': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`bg-card border-r border-border p-4 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-0 p-0 overflow-hidden'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          iconName="ChevronLeft"
          iconPosition="right"
        >
          Collapse
        </Button>
      </div>
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search violations..."
          value={filters?.search}
          onChange={(e) => handleFilterChange('search', e?.target?.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 gap-4">
          <Input
            type="date"
            label="From Date"
            value={filters?.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={filters?.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Violation Type"
            options={violationTypeOptions}
            value={filters?.violationType || 'all-violationType'}
            onChange={(value) => handleFilterChange('violationType', value)}
          />
          <Select
            label="Severity Level"
            options={severityOptions}
            value={filters?.severity || 'all-severity'}
            onChange={(value) => handleFilterChange('severity', value)}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={filters?.status || 'all-status'}
            onChange={(value) => handleFilterChange('status', value)}
          />
          <Select
            label="Camera Location"
            options={cameraLocationOptions}
            value={filters?.cameraLocation || 'all'}
            onChange={(value) => handleFilterChange('cameraLocation', value)}
            searchable
          />
        </div>
      </div>
      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {filters?.search && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Icon name="Search" size={14} />
              <span>Search: "{filters?.search}"</span>
              <button
                onClick={() => handleFilterChange('search', '')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {filters?.violationType !== 'all-violationType' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Icon name="AlertTriangle" size={14} />
              <span>Type: {violationTypeOptions?.find(opt => opt?.value === filters?.violationType)?.label}</span>
              <button
                onClick={() => handleFilterChange('violationType', 'all-violationType')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {filters?.severity !== 'all-severity' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Icon name="Zap" size={14} className={getSeverityColor(filters?.severity)} />
              <span>Severity: {severityOptions?.find(opt => opt?.value === filters?.severity)?.label}</span>
              <button
                onClick={() => handleFilterChange('severity', 'all-severity')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {filters?.status !== 'all-status' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(filters?.status)?.split(' ')[0]}`} />
              <span>Status: {statusOptions?.find(opt => opt?.value === filters?.status)?.label}</span>
              <button
                onClick={() => handleFilterChange('status', 'all-status')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {filters?.cameraLocation !== 'all' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Icon name="Camera" size={14} />
              <span>Location: {cameraLocationOptions?.find(opt => opt?.value === filters?.cameraLocation)?.label}</span>
              <button
                onClick={() => handleFilterChange('cameraLocation', 'all')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {(filters?.dateFrom || filters?.dateTo) && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Icon name="Calendar" size={14} />
              <span>
                Date: {filters?.dateFrom || 'Start'} - {filters?.dateTo || 'End'}
              </span>
              <button
                onClick={() => {
                  handleFilterChange('dateFrom', '');
                  handleFilterChange('dateTo', '');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
        </div>
      )}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
            fullWidth
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ViolationFilters;
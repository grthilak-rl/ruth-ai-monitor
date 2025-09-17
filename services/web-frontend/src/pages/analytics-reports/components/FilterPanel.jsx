import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

const FilterPanel = ({ isCollapsed, onToggleCollapse, filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    dateRange: '30d',
    violationTypes: [],
    severityLevels: [],
    cameraLocations: [],
    shiftPatterns: []
  });

  const violationTypes = [
    { id: 'ppe', label: 'PPE Violations', count: 156 },
    { id: 'fire', label: 'Fire/Smoke Detection', count: 23 },
    { id: 'fall', label: 'Fall Detection', count: 89 },
    { id: 'restricted', label: 'Restricted Area', count: 34 },
    { id: 'equipment', label: 'Equipment Safety', count: 67 }
  ];

  const severityLevels = [
    { id: 'critical', label: 'Critical', count: 45, color: 'text-error' },
    { id: 'high', label: 'High', count: 123, color: 'text-warning' },
    { id: 'medium', label: 'Medium', count: 187, color: 'text-accent' },
    { id: 'low', label: 'Low', count: 89, color: 'text-success' }
  ];

  const cameraLocations = [
    { id: 'warehouse-a', label: 'Warehouse A', count: 89 },
    { id: 'warehouse-b', label: 'Warehouse B', count: 67 },
    { id: 'production-floor', label: 'Production Floor', count: 134 },
    { id: 'loading-dock', label: 'Loading Dock', count: 45 },
    { id: 'office-area', label: 'Office Area', count: 23 },
    { id: 'parking-lot', label: 'Parking Lot', count: 12 }
  ];



  const handleFilterChange = (category, value, checked) => {
    const newFilters = { ...localFilters };
    
    if (checked) {
      newFilters[category] = [...(newFilters?.[category] || []), value];
    } else {
      newFilters[category] = (newFilters?.[category] || [])?.filter(item => item !== value);
    }
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      dateRange: '30d',
      violationTypes: [],
      severityLevels: [],
      cameraLocations: [],
      shiftPatterns: []
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters)?.reduce((count, filterArray) => {
      if (Array.isArray(filterArray)) {
        return count + filterArray?.length;
      }
      return count;
    }, 0);
  };

  const FilterSection = ({ title, items, category, icon }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon name={icon} size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      <div className="space-y-2 pl-6">
        {items?.map((item) => (
          <div key={item?.id} className="flex items-center justify-between">
            <Checkbox
              label={item?.label}
              checked={(localFilters?.[category] || [])?.includes(item?.id)}
              onCheckedChange={(checked) => handleFilterChange(category, item?.id, checked)}
              size="sm"
            />
            <span className={`text-xs ${item?.color || 'text-muted-foreground'}`}>
              {item?.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border">
        <div className="p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-full"
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
          {getActiveFilterCount() > 0 && (
            <div className="mt-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mx-auto">
              {getActiveFilterCount()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
        </div>

        {/* Clear All Button */}
        {getActiveFilterCount() > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full"
            iconName="X"
            iconPosition="left"
          >
            Clear All Filters
          </Button>
        )}

        {/* Filter Sections */}
        <FilterSection
          title="Violation Types"
          items={violationTypes}
          category="violationTypes"
          icon="AlertTriangle"
        />

        <FilterSection
          title="Severity Levels"
          items={severityLevels}
          category="severityLevels"
          icon="Zap"
        />

        <FilterSection
          title="Camera Locations"
          items={cameraLocations}
          category="cameraLocations"
          icon="MapPin"
        />


      </div>
    </div>
  );
};

export default FilterPanel;
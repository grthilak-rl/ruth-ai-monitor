import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';

const DateRangeSelector = ({ selectedRange, onRangeChange, customRange, onCustomRangeChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const predefinedRanges = [
    { label: 'Last 5 Hours', value: '5h' },
    { label: 'Last Day', value: '1d' },
    { label: 'Custom Range', value: 'custom' }
  ];

  const handleRangeSelect = (value) => {
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onRangeChange(value);
    }
  };

  const handleCustomApply = () => {
    if (customRange?.startDate && customRange?.endDate) {
      onRangeChange('custom');
      setShowCustomPicker(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-1">
        {predefinedRanges?.map((range) => (
          <button
            key={range?.value}
            onClick={() => handleRangeSelect(range?.value)}
            className={`
              px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
              ${selectedRange === range?.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {range?.label}
          </button>
        ))}
      </div>
      {showCustomPicker && (
        <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 z-10 min-w-[300px]">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="Calendar" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Custom Date Range</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customRange?.startDate || ''}
                  onChange={(e) => onCustomRangeChange({ ...customRange, startDate: e?.target?.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customRange?.endDate || ''}
                  onChange={(e) => onCustomRangeChange({ ...customRange, endDate: e?.target?.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {customRange?.startDate && customRange?.endDate && (
                  `${formatDate(customRange?.startDate)} - ${formatDate(customRange?.endDate)}`
                )}
              </span>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomPicker(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCustomApply}
                  disabled={!customRange?.startDate || !customRange?.endDate}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
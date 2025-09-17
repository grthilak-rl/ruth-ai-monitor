import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';

const BulkActions = ({ selectedCount, onBulkStatusUpdate, onBulkExport, onBulkAssign, onBulkDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const statusOptions = [
    { value: 'investigating', label: 'Mark as Investigating' },
    { value: 'reviewed', label: 'Mark as Reviewed' },
    { value: 'false_positive', label: 'Mark as False Positive' }
  ];


  const exportOptions = [
    { value: 'pdf', label: 'Export as PDF Report' },
    { value: 'excel', label: 'Export as Excel' },
    { value: 'csv', label: 'Export as CSV' }
  ];

  const handleStatusUpdate = (status) => {
    onBulkStatusUpdate(status);
    setShowActions(false);
  };


  const handleExport = (format) => {
    onBulkExport(format);
    setShowActions(false);
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowActions(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[320px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} violation{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            iconName={showActions ? 'ChevronDown' : 'ChevronUp'}
          />
        </div>

        {showActions && (
          <div className="space-y-3">
            {/* Status Update Actions */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Update Status
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions?.map((option) => (
                  <Button
                    key={option?.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(option?.value)}
                    className="text-xs"
                  >
                    {option?.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Export Actions */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Export Selected
              </h4>
              <div className="flex space-x-2">
                {exportOptions?.map((option) => (
                  <Button
                    key={option?.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(option?.value)}
                    iconName={
                      option?.value === 'pdf' ? 'FileText' :
                      option?.value === 'excel' ? 'FileSpreadsheet' : 'Download'
                    }
                    iconPosition="left"
                    className="text-xs"
                  >
                    {option?.value?.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Additional Actions */}
            <div className="pt-2 border-t border-border">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  iconName="Trash2"
                  iconPosition="left"
                  className="text-xs text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle bulk archive
                    console.log('Bulk archive requested');
                    setShowActions(false);
                  }}
                  iconName="Archive"
                  iconPosition="left"
                  className="text-xs"
                >
                  Archive
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActions;
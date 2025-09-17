import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';

const ExportToolbar = ({ onExport, loading = false }) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    format: 'pdf',
    recipients: '',
    includeCharts: true,
    includeMetrics: true
  });

  const exportOptions = [
    {
      type: 'pdf',
      label: 'PDF Report',
      icon: 'FileText',
      description: 'Comprehensive safety compliance report with charts and metrics'
    },
    {
      type: 'excel',
      label: 'Excel Export',
      icon: 'FileSpreadsheet',
      description: 'Raw violation data with detailed analysis'
    },
    {
      type: 'csv',
      label: 'CSV Data',
      icon: 'Database',
      description: 'Violation records for external analysis'
    }
  ];

  const handleExport = (type) => {
    if (onExport) {
      onExport(type);
    }
  };

  const handleScheduleReport = () => {
    // Handle scheduled report setup
    console.log('Scheduling report with config:', scheduleConfig);
    setShowScheduleModal(false);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Download" size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Export Reports</h3>
              <p className="text-xs text-muted-foreground">
                Generate compliance reports with metric descriptions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {exportOptions?.map((option) => (
              <Button
                key={option?.type}
                variant="outline"
                size="sm"
                onClick={() => handleExport(option?.type)}
                disabled={loading}
                iconName={option?.icon}
                iconPosition="left"
                title={option?.description}
              >
                {option?.label}
              </Button>
            ))}
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowScheduleModal(true)}
              iconName="Calendar"
              iconPosition="left"
            >
              Schedule Reports
            </Button>
          </div>
        </div>
      </div>
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-popover border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Schedule Reports</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScheduleModal(false)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Frequency
                </label>
                <select
                  value={scheduleConfig?.frequency}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e?.target?.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Report Format
                </label>
                <select
                  value={scheduleConfig?.format}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, format: e?.target?.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="both">Both PDF & Excel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Recipients
                </label>
                <input
                  type="email"
                  placeholder="Enter email addresses (comma separated)"
                  value={scheduleConfig?.recipients}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, recipients: e?.target?.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Include in Report
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={scheduleConfig?.includeCharts}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, includeCharts: e?.target?.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Charts and Visualizations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={scheduleConfig?.includeMetrics}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, includeMetrics: e?.target?.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Detailed Metrics Descriptions</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleScheduleReport}
                iconName="Check"
                iconPosition="left"
              >
                Schedule Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportToolbar;
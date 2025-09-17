import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const ViolationDetailsModal = ({ violation, isOpen, onClose, onStatusUpdate, onNotesUpdate }) => {
  const [notes, setNotes] = useState(violation?.notes || '');
  const [status, setStatus] = useState(violation?.status || 'new');
  const [investigator, setInvestigator] = useState(violation?.investigator || '');

  if (!isOpen || !violation) return null;

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'false_positive', label: 'False Positive' }
  ];

  const investigatorOptions = [
    { value: '', label: 'Unassigned' },
    { value: 'john_smith', label: 'John Smith' },
    { value: 'sarah_johnson', label: 'Sarah Johnson' },
    { value: 'mike_chen', label: 'Mike Chen' },
    { value: 'lisa_rodriguez', label: 'Lisa Rodriguez' },
    { value: 'david_wilson', label: 'David Wilson' }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-destructive bg-destructive/10';
      case 'high': return 'text-error bg-error/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted/10';
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleSave = () => {
    onStatusUpdate(violation?.id, {
      status,
      investigator,
      notes
    });
    onClose();
  };

  const handleExport = (format) => {
    console.log(`Exporting violation ${violation?.id} as ${format}`);
    // Implementation for exporting single violation
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="AlertTriangle" size={24} className="text-warning" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Violation Details</h2>
              <p className="text-sm text-muted-foreground">ID: {violation?.id}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>
        
        {/* Status Banner */}
        <div className={`w-full py-3 px-6 ${getStatusColor(status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name={status === 'resolved' ? 'CheckCircle' : status === 'investigating' ? 'Search' : 'AlertCircle'} size={18} />
              <span className="font-medium capitalize">{status.replace('_', ' ')}</span>
            </div>
            {investigator && (
              <div className="text-sm">
                <span>Assigned to: </span>
                <span className="font-medium">{investigatorOptions.find(opt => opt.value === investigator)?.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Incident Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span className="text-foreground font-mono text-sm">
                        {formatTimestamp(violation?.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Violation Type:</span>
                      <span className="text-foreground font-medium capitalize">
                        {violation?.violationType?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Severity:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation?.severity)}`}>
                        {violation?.severity?.charAt(0)?.toUpperCase() + violation?.severity?.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Camera Location:</span>
                      <span className="text-foreground">{violation?.cameraLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">AI Confidence:</span>
                      <span className="text-foreground font-medium">{violation?.aiConfidence}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {violation?.description}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Violation Image</h3>
                <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
                  <AppImage
                    src={violation?.fullImageUrl}
                    alt={`${violation?.violationType} violation`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(violation?.fullImageUrl, '_blank')}
                    iconName="ExternalLink"
                    iconPosition="left"
                  >
                    View Full Size
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = violation?.fullImageUrl;
                      link.download = `violation_${violation?.id}_image.jpg`;
                      link?.click();
                    }}
                    iconName="Download"
                    iconPosition="left"
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Investigation Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Investigation & Management</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Select
                    label="Status"
                    options={statusOptions}
                    value={status}
                    onChange={setStatus}
                  />
                  <Select
                    label="Assigned Investigator"
                    options={investigatorOptions}
                    value={investigator}
                    onChange={setInvestigator}
                  />
                </div>
                <div>
                  <Input
                    label="Investigation Notes"
                    type="textarea"
                    placeholder="Add investigation notes, findings, or corrective actions taken..."
                    value={notes}
                    onChange={(e) => setNotes(e?.target?.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-error rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Violation Detected</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(violation?.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI system detected {violation?.violationType?.replace('_', ' ')} with {violation?.aiConfidence}% confidence
                    </p>
                  </div>
                </div>
                
                {violation?.investigator && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Assigned for Investigation</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp.getTime() + 300000)?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assigned to {violation?.investigator} for review
                      </p>
                    </div>
                  </div>
                )}

                {violation?.status === 'resolved' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Violation Resolved</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp.getTime() + 1800000)?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Investigation completed and corrective actions implemented
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              iconName="FileText"
              iconPosition="left"
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              iconName="FileSpreadsheet"
              iconPosition="left"
            >
              Export Excel
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationDetailsModal;
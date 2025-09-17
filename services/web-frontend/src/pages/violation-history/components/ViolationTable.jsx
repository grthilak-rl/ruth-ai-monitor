import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

const ViolationTable = ({ 
  violations, 
  selectedViolations, 
  onSelectionChange, 
  onStatusUpdate, 
  onViewDetails,
  sortConfig,
  onSort 
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

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
    return {
      date: date?.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date?.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(violations?.map(v => v?.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleRowSelect = (violationId, checked) => {
    if (checked) {
      onSelectionChange([...selectedViolations, violationId]);
    } else {
      onSelectionChange(selectedViolations?.filter(id => id !== violationId));
    }
  };

  const toggleRowExpansion = (violationId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded?.has(violationId)) {
      newExpanded?.delete(violationId);
    } else {
      newExpanded?.add(violationId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column) => {
    const direction = sortConfig?.key === column && sortConfig?.direction === 'asc' ? 'desc' : 'asc';
    onSort({ key: column, direction });
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const isAllSelected = violations?.length > 0 && selectedViolations?.length === violations?.length;
  const isIndeterminate = selectedViolations?.length > 0 && selectedViolations?.length < violations?.length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={(checked) => handleSelectAll(checked)}
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span>Timestamp</span>
                  <Icon name={getSortIcon('timestamp')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Preview</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">
                <button
                  onClick={() => handleSort('violationType')}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span>Violation Type</span>
                  <Icon name={getSortIcon('violationType')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">
                <button
                  onClick={() => handleSort('severity')}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span>Severity</span>
                  <Icon name={getSortIcon('severity')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">
                <button
                  onClick={() => handleSort('cameraLocation')}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span>Location</span>
                  <Icon name={getSortIcon('cameraLocation')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-2 hover:text-accent transition-colors"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {violations?.map((violation) => {
              const isSelected = selectedViolations?.includes(violation?.id);
              const isExpanded = expandedRows?.has(violation?.id);
              const timestamp = formatTimestamp(violation?.timestamp);

              return (
                <React.Fragment key={violation?.id}>
                  <tr className={`border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-accent/10' : ''}`}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleRowSelect(violation?.id, checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{timestamp?.date}</span>
                        <span className="text-xs text-muted-foreground font-mono">{timestamp?.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-16 h-12 rounded-md overflow-hidden bg-muted">
                        <AppImage
                          src={violation?.thumbnailUrl}
                          alt={`${violation?.violationType} violation`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Icon name="AlertTriangle" size={16} className="text-warning" />
                        <span className="text-sm font-medium text-foreground capitalize">
                          {violation?.violationType?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation?.severity)}`}>
                        {violation?.severity?.charAt(0)?.toUpperCase() + violation?.severity?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Icon name="Camera" size={14} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">{violation?.cameraLocation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(violation?.status)}`}>
                        {violation?.status?.charAt(0)?.toUpperCase() + violation?.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(violation?.id)}
                          iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(violation)}
                          iconName="Eye"
                        />
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr className="bg-muted/20 border-b border-border">
                      <td colSpan="8" className="px-4 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Incident Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <Icon name="Target" size={14} className="text-muted-foreground" />
                                <span className="text-muted-foreground">AI Confidence:</span>
                                <span className="font-medium text-foreground">{violation?.aiConfidence}%</span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Icon name="FileText" size={14} className="text-muted-foreground mt-0.5" />
                                <div>
                                  <span className="text-muted-foreground">Description:</span>
                                  <p className="text-foreground mt-1">{violation?.description}</p>
                                </div>
                              </div>
                              {violation?.notes && (
                                <div className="flex items-start space-x-2">
                                  <Icon name="MessageSquare" size={14} className="text-muted-foreground mt-0.5" />
                                  <div>
                                    <span className="text-muted-foreground">Investigation Notes:</span>
                                    <p className="text-foreground mt-1">{violation?.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Full Image</h4>
                            <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                              <AppImage
                                src={violation?.fullImageUrl}
                                alt={`Full ${violation?.violationType} violation image`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {violations?.map((violation) => {
          const isSelected = selectedViolations?.includes(violation?.id);
          const timestamp = formatTimestamp(violation?.timestamp);

          return (
            <div
              key={violation?.id}
              className={`border border-border rounded-lg p-4 ${isSelected ? 'bg-accent/10 border-accent' : 'bg-card'}`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleRowSelect(violation?.id, checked)}
                />
                <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <AppImage
                    src={violation?.thumbnailUrl}
                    alt={`${violation?.violationType} violation`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertTriangle" size={16} className="text-warning" />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {violation?.violationType?.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation?.severity)}`}>
                      {violation?.severity}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">{violation?.cameraLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="text-foreground font-mono">{timestamp?.date} {timestamp?.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(violation?.status)}`}>
                        {violation?.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      Investigator: {violation?.investigator || 'Unassigned'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(violation)}
                      iconName="Eye"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Empty State */}
      {violations?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="Search" size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No violations found</h3>
          <p className="text-muted-foreground max-w-md">
            No violations match your current filter criteria. Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
};

export default ViolationTable;
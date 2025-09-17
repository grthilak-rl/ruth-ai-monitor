import React from 'react';
import Icon from '@/components/AppIcon';

const ViolationStats = ({ violations, filters, onRefresh }) => {
  const calculateStats = () => {
    const total = violations?.length;
    
    const byStatus = violations?.reduce((acc, violation) => {
      acc[violation.status] = (acc?.[violation?.status] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = violations?.reduce((acc, violation) => {
      acc[violation.severity] = (acc?.[violation?.severity] || 0) + 1;
      return acc;
    }, {});

    const byType = violations?.reduce((acc, violation) => {
      acc[violation.violationType] = (acc?.[violation?.violationType] || 0) + 1;
      return acc;
    }, {});

    // Calculate resolution rate
    const resolved = byStatus?.resolved || 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Calculate average response time (mock calculation)
    const avgResponseTime = total > 0 ? Math.round(Math.random() * 120 + 30) : 0;

    return {
      total,
      byStatus,
      bySeverity,
      byType,
      resolutionRate,
      avgResponseTime
    };
  };

  const stats = calculateStats();

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'text-error';
      case 'investigating': return 'text-warning';
      case 'reviewed': return 'text-accent';
      case 'resolved': return 'text-success';
      case 'false_positive': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
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

  const statCards = [
    {
      title: 'Total Violations',
      value: stats?.total,
      icon: 'AlertTriangle',
      color: 'text-foreground',
      bgColor: 'bg-muted/50'
    },
    {
      title: 'Resolution Rate',
      value: `${stats?.resolutionRate}%`,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Avg Response Time',
      value: `${stats?.avgResponseTime}m`,
      icon: 'Clock',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Critical Issues',
      value: stats?.bySeverity?.critical || 0,
      icon: 'Zap',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Main Stats Cards */}
      {statCards?.map((card, index) => (
        <div key={index} className={`bg-card border border-border rounded-lg p-4 ${card?.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{card?.title}</p>
              <p className={`text-2xl font-bold ${card?.color}`}>{card?.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${card?.bgColor} flex items-center justify-center`}>
              <Icon name={card?.icon} size={24} className={card?.color} />
            </div>
          </div>
        </div>
      ))}
      {/* Status Breakdown */}
      <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Status Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(stats?.byStatus)?.map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'new' ? 'bg-error' :
                  status === 'investigating' ? 'bg-warning' :
                  status === 'reviewed' ? 'bg-accent' :
                  status === 'resolved'? 'bg-success' : 'bg-muted'
                }`} />
                <span className="text-sm text-foreground capitalize">
                  {status?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground">{count}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats?.total > 0 ? Math.round((count / stats?.total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Severity Distribution */}
      <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Severity Distribution</h3>
        <div className="space-y-2">
          {Object.entries(stats?.bySeverity)?.map(([severity, count]) => (
            <div key={severity} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name="Zap" 
                  size={12} 
                  className={getSeverityColor(severity)} 
                />
                <span className="text-sm text-foreground capitalize">{severity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground">{count}</span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      severity === 'critical' ? 'bg-destructive' :
                      severity === 'high' ? 'bg-error' :
                      severity === 'medium'? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ 
                      width: `${stats?.total > 0 ? (count / stats?.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Top Violation Types */}
      <div className="md:col-span-2 lg:col-span-4 bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Top Violation Types</h3>
          <button
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Data"
          >
            <Icon name="RefreshCw" size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats?.byType)?.sort(([,a], [,b]) => b - a)?.slice(0, 4)?.map(([type, count]) => (
              <div key={type} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Icon name="AlertTriangle" size={16} className="text-warning" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize truncate">
                    {type?.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">{count} incidents</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ViolationStats;
import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import Select from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const SystemConfigurationTab = ({ systemConfig, userRole, onSave }) => {
  const [config, setConfig] = useState({
    defaultAIModel: systemConfig?.defaultAIModel || 'yolo-v8-safety',
    cameraTimeout: systemConfig?.cameraTimeout || 30,
    alertThreshold: systemConfig?.alertThreshold || 'medium',
    autoArchive: systemConfig?.autoArchive ?? true,
    archiveDays: systemConfig?.archiveDays || 90,
    reportTemplate: systemConfig?.reportTemplate || 'standard',
    dataRetention: systemConfig?.dataRetention || 365,
    systemMaintenance: {
      autoUpdates: systemConfig?.systemMaintenance?.autoUpdates ?? true,
      maintenanceWindow: systemConfig?.systemMaintenance?.maintenanceWindow || '02:00-04:00',
      backupFrequency: systemConfig?.systemMaintenance?.backupFrequency || 'daily'
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = userRole === 'admin' || userRole === 'system_administrator';

  const aiModelOptions = [
    { value: 'yolo-v8-safety', label: 'YOLO v8 Safety', description: 'Latest safety detection model' },
    { value: 'yolo-v7-industrial', label: 'YOLO v7 Industrial', description: 'Optimized for industrial environments' },
    { value: 'detectron2-ppe', label: 'Detectron2 PPE', description: 'Specialized PPE detection' },
    { value: 'custom-safety-v2', label: 'Custom Safety v2', description: 'Custom trained safety model' }
  ];

  const alertThresholdOptions = [
    { value: 'low', label: 'Low Sensitivity', description: 'Fewer false positives, may miss some violations' },
    { value: 'medium', label: 'Medium Sensitivity', description: 'Balanced detection accuracy' },
    { value: 'high', label: 'High Sensitivity', description: 'Maximum detection, more false positives' }
  ];

  const reportTemplateOptions = [
    { value: 'standard', label: 'Standard Report', description: 'Basic violation summary and metrics' },
    { value: 'detailed', label: 'Detailed Report', description: 'Comprehensive analysis with images' },
    { value: 'executive', label: 'Executive Summary', description: 'High-level overview for management' },
    { value: 'compliance', label: 'Compliance Report', description: 'Regulatory compliance focused' }
  ];

  const backupFrequencyOptions = [
    { value: 'hourly', label: 'Hourly', description: 'Every hour (high storage usage)' },
    { value: 'daily', label: 'Daily', description: 'Once per day at 2:00 AM' },
    { value: 'weekly', label: 'Weekly', description: 'Every Sunday at 2:00 AM' }
  ];

  const handleConfigChange = (field, value) => {
    if (field?.includes('.')) {
      const [parent, child] = field?.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev?.[parent],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (onSave) {
      onSave(config);
    }
    
    setIsSaving(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setConfig({
        defaultAIModel: 'yolo-v8-safety',
        cameraTimeout: 30,
        alertThreshold: 'medium',
        autoArchive: true,
        archiveDays: 90,
        reportTemplate: 'standard',
        dataRetention: 365,
        systemMaintenance: {
          autoUpdates: true,
          maintenanceWindow: '02:00-04:00',
          backupFrequency: 'daily'
        }
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon name="Lock" size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground max-w-md">
          System configuration settings are only available to administrators. 
          Contact your system administrator if you need to modify these settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Model Configuration */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Brain" size={20} className="text-accent" />
          <h4 className="text-lg font-medium text-foreground">AI Model Configuration</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure default AI models and detection parameters for new cameras
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Default AI Model"
            description="Default model assigned to new cameras"
            options={aiModelOptions}
            value={config?.defaultAIModel}
            onChange={(value) => handleConfigChange('defaultAIModel', value)}
          />
          
          <Select
            label="Alert Threshold"
            description="Sensitivity level for violation detection"
            options={alertThresholdOptions}
            value={config?.alertThreshold}
            onChange={(value) => handleConfigChange('alertThreshold', value)}
          />
        </div>
      </div>
      {/* Camera & Monitoring Settings */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Camera" size={20} className="text-primary" />
          <h4 className="text-lg font-medium text-foreground">Camera & Monitoring Settings</h4>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Input
            label="Camera Timeout (seconds)"
            type="number"
            description="Timeout for camera connection attempts"
            value={config?.cameraTimeout}
            onChange={(e) => handleConfigChange('cameraTimeout', parseInt(e?.target?.value))}
            min={10}
            max={120}
          />
          
          <div className="space-y-4">
            <Checkbox
              label="Auto-Archive Violations"
              description="Automatically archive old violation records"
              checked={config?.autoArchive}
              onChange={(e) => handleConfigChange('autoArchive', e?.target?.checked)}
            />
            
            {config?.autoArchive && (
              <Input
                label="Archive After (days)"
                type="number"
                description="Days before violations are archived"
                value={config?.archiveDays}
                onChange={(e) => handleConfigChange('archiveDays', parseInt(e?.target?.value))}
                min={30}
                max={365}
                className="ml-6"
              />
            )}
          </div>
        </div>
      </div>
      {/* Report Configuration */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="FileText" size={20} className="text-success" />
          <h4 className="text-lg font-medium text-foreground">Report Configuration</h4>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Default Report Template"
            description="Default template for generated reports"
            options={reportTemplateOptions}
            value={config?.reportTemplate}
            onChange={(value) => handleConfigChange('reportTemplate', value)}
          />
          
          <Input
            label="Data Retention (days)"
            type="number"
            description="Days to retain violation data before deletion"
            value={config?.dataRetention}
            onChange={(e) => handleConfigChange('dataRetention', parseInt(e?.target?.value))}
            min={90}
            max={2555}
          />
        </div>
      </div>
      {/* System Maintenance */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Settings" size={20} className="text-warning" />
          <h4 className="text-lg font-medium text-foreground">System Maintenance</h4>
        </div>
        
        <div className="space-y-6">
          <Checkbox
            label="Automatic Updates"
            description="Automatically install system updates during maintenance window"
            checked={config?.systemMaintenance?.autoUpdates}
            onChange={(e) => handleConfigChange('systemMaintenance.autoUpdates', e?.target?.checked)}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Maintenance Window</label>
              <input
                type="text"
                value={config?.systemMaintenance?.maintenanceWindow}
                onChange={(e) => handleConfigChange('systemMaintenance.maintenanceWindow', e?.target?.value)}
                placeholder="HH:MM-HH:MM"
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">24-hour format (e.g., 02:00-04:00)</p>
            </div>
            
            <Select
              label="Backup Frequency"
              description="How often to backup system data"
              options={backupFrequencyOptions}
              value={config?.systemMaintenance?.backupFrequency}
              onChange={(value) => handleConfigChange('systemMaintenance.backupFrequency', value)}
            />
          </div>
        </div>
      </div>
      {/* System Status */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Activity" size={20} className="text-error" />
          <h4 className="text-lg font-medium text-foreground">System Status</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-success/10 border border-success/20 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-sm font-medium text-success">System Health</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </div>
          
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <span className="text-sm font-medium text-warning">Storage Usage</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">78% of available space</p>
          </div>
          
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span className="text-sm font-medium text-accent">Last Backup</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
        <Button
          variant="outline"
          iconName="RotateCcw"
          iconPosition="left"
          onClick={handleResetToDefaults}
        >
          Reset to Defaults
        </Button>
        
        <Button
          variant="default"
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default SystemConfigurationTab;
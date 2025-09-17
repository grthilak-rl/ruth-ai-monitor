import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Checkbox } from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const NotificationPreferencesTab = ({ preferences, onSave }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    violationAlerts: {
      ppeViolation: preferences?.violationAlerts?.ppeViolation ?? true,
      fallDetection: preferences?.violationAlerts?.fallDetection ?? true,
      fireDetection: preferences?.violationAlerts?.fireDetection ?? true,
      unauthorizedAccess: preferences?.violationAlerts?.unauthorizedAccess ?? true,
      equipmentMalfunction: preferences?.violationAlerts?.equipmentMalfunction ?? false
    },
    deliveryMethods: {
      email: preferences?.deliveryMethods?.email ?? true,
      sms: preferences?.deliveryMethods?.sms ?? false,
      inApp: preferences?.deliveryMethods?.inApp ?? true,
      desktop: preferences?.deliveryMethods?.desktop ?? true
    },
    frequency: preferences?.frequency || 'immediate',
    quietHours: {
      enabled: preferences?.quietHours?.enabled ?? false,
      startTime: preferences?.quietHours?.startTime || '22:00',
      endTime: preferences?.quietHours?.endTime || '06:00'
    },
    reportSchedule: {
      daily: preferences?.reportSchedule?.daily ?? false,
      weekly: preferences?.reportSchedule?.weekly ?? true,
      monthly: preferences?.reportSchedule?.monthly ?? true
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate', description: 'Receive alerts instantly' },
    { value: 'batched-5min', label: 'Every 5 minutes', description: 'Batch alerts every 5 minutes' },
    { value: 'batched-15min', label: 'Every 15 minutes', description: 'Batch alerts every 15 minutes' },
    { value: 'batched-hourly', label: 'Hourly', description: 'Batch alerts every hour' }
  ];

  const handleViolationAlertChange = (type, checked) => {
    setNotificationSettings(prev => ({
      ...prev,
      violationAlerts: {
        ...prev?.violationAlerts,
        [type]: checked
      }
    }));
  };

  const handleDeliveryMethodChange = (method, checked) => {
    setNotificationSettings(prev => ({
      ...prev,
      deliveryMethods: {
        ...prev?.deliveryMethods,
        [method]: checked
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev?.quietHours,
        [field]: value
      }
    }));
  };

  const handleReportScheduleChange = (type, checked) => {
    setNotificationSettings(prev => ({
      ...prev,
      reportSchedule: {
        ...prev?.reportSchedule,
        [type]: checked
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onSave) {
      onSave(notificationSettings);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Violation Alert Types */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="AlertTriangle" size={20} className="text-warning" />
          <h4 className="text-lg font-medium text-foreground">Violation Alert Types</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which types of safety violations you want to be notified about
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="PPE Violations"
            description="Missing helmets, safety vests, gloves, etc."
            checked={notificationSettings?.violationAlerts?.ppeViolation}
            onChange={(e) => handleViolationAlertChange('ppeViolation', e?.target?.checked)}
          />
          
          <Checkbox
            label="Fall Detection"
            description="Worker falls or unsafe positioning"
            checked={notificationSettings?.violationAlerts?.fallDetection}
            onChange={(e) => handleViolationAlertChange('fallDetection', e?.target?.checked)}
          />
          
          <Checkbox
            label="Fire & Smoke Detection"
            description="Fire hazards and smoke detection"
            checked={notificationSettings?.violationAlerts?.fireDetection}
            onChange={(e) => handleViolationAlertChange('fireDetection', e?.target?.checked)}
          />
          
          <Checkbox
            label="Unauthorized Access"
            description="Restricted area violations"
            checked={notificationSettings?.violationAlerts?.unauthorizedAccess}
            onChange={(e) => handleViolationAlertChange('unauthorizedAccess', e?.target?.checked)}
          />
          
          <Checkbox
            label="Equipment Malfunction"
            description="Safety equipment failures"
            checked={notificationSettings?.violationAlerts?.equipmentMalfunction}
            onChange={(e) => handleViolationAlertChange('equipmentMalfunction', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Delivery Methods */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Send" size={20} className="text-accent" />
          <h4 className="text-lg font-medium text-foreground">Delivery Methods</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Select how you want to receive notifications
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Email Notifications"
            description="Receive alerts via email"
            checked={notificationSettings?.deliveryMethods?.email}
            onChange={(e) => handleDeliveryMethodChange('email', e?.target?.checked)}
          />
          
          <Checkbox
            label="SMS Notifications"
            description="Receive alerts via text message"
            checked={notificationSettings?.deliveryMethods?.sms}
            onChange={(e) => handleDeliveryMethodChange('sms', e?.target?.checked)}
          />
          
          <Checkbox
            label="In-App Notifications"
            description="Show alerts within the application"
            checked={notificationSettings?.deliveryMethods?.inApp}
            onChange={(e) => handleDeliveryMethodChange('inApp', e?.target?.checked)}
          />
          
          <Checkbox
            label="Desktop Notifications"
            description="Browser push notifications"
            checked={notificationSettings?.deliveryMethods?.desktop}
            onChange={(e) => handleDeliveryMethodChange('desktop', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Frequency & Timing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Frequency */}
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Clock" size={20} className="text-primary" />
            <h4 className="text-lg font-medium text-foreground">Notification Frequency</h4>
          </div>
          
          <Select
            label="Alert Frequency"
            description="How often to receive notifications"
            options={frequencyOptions}
            value={notificationSettings?.frequency}
            onChange={(value) => setNotificationSettings(prev => ({ ...prev, frequency: value }))}
          />
        </div>

        {/* Quiet Hours */}
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Moon" size={20} className="text-secondary" />
            <h4 className="text-lg font-medium text-foreground">Quiet Hours</h4>
          </div>
          
          <div className="space-y-4">
            <Checkbox
              label="Enable Quiet Hours"
              description="Suppress non-critical alerts during specified hours"
              checked={notificationSettings?.quietHours?.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e?.target?.checked)}
            />
            
            {notificationSettings?.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    value={notificationSettings?.quietHours?.startTime}
                    onChange={(e) => handleQuietHoursChange('startTime', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    value={notificationSettings?.quietHours?.endTime}
                    onChange={(e) => handleQuietHoursChange('endTime', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Report Schedule */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="FileText" size={20} className="text-success" />
          <h4 className="text-lg font-medium text-foreground">Automated Reports</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Schedule automatic safety reports to be sent to your email
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Checkbox
            label="Daily Reports"
            description="Daily safety summary at 8:00 AM"
            checked={notificationSettings?.reportSchedule?.daily}
            onChange={(e) => handleReportScheduleChange('daily', e?.target?.checked)}
          />
          
          <Checkbox
            label="Weekly Reports"
            description="Weekly summary every Monday"
            checked={notificationSettings?.reportSchedule?.weekly}
            onChange={(e) => handleReportScheduleChange('weekly', e?.target?.checked)}
          />
          
          <Checkbox
            label="Monthly Reports"
            description="Monthly compliance report"
            checked={notificationSettings?.reportSchedule?.monthly}
            onChange={(e) => handleReportScheduleChange('monthly', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="default"
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
          onClick={handleSave}
        >
          Save Notification Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferencesTab;
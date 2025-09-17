import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const SecuritySettingsTab = ({ securitySettings, onSave }) => {
  const [settings, setSettings] = useState({
    twoFactorEnabled: securitySettings?.twoFactorEnabled ?? false,
    loginNotifications: securitySettings?.loginNotifications ?? true,
    sessionTimeout: securitySettings?.sessionTimeout ?? 30,
    allowMultipleSessions: securitySettings?.allowMultipleSessions ?? false
  });

  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mock active sessions data
  const activeSessions = [
    {
      id: 1,
      device: 'Windows Desktop',
      browser: 'Chrome 118.0',
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      lastActive: '2025-08-31 16:01:56',
      isCurrent: true
    },
    {
      id: 2,
      device: 'iPhone 15',
      browser: 'Safari Mobile',
      location: 'New York, NY',
      ipAddress: '192.168.1.105',
      lastActive: '2025-08-31 14:30:22',
      isCurrent: false
    },
    {
      id: 3,
      device: 'iPad Pro',
      browser: 'Safari',
      location: 'New York, NY',
      ipAddress: '192.168.1.108',
      lastActive: '2025-08-30 18:45:10',
      isCurrent: false
    }
  ];

  // Mock login history data
  const loginHistory = [
    {
      id: 1,
      timestamp: '2025-08-31 16:01:56',
      device: 'Windows Desktop',
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2025-08-31 08:15:30',
      device: 'iPhone 15',
      location: 'New York, NY',
      ipAddress: '192.168.1.105',
      status: 'success'
    },
    {
      id: 3,
      timestamp: '2025-08-30 18:45:10',
      device: 'iPad Pro',
      location: 'New York, NY',
      ipAddress: '192.168.1.108',
      status: 'success'
    },
    {
      id: 4,
      timestamp: '2025-08-30 09:22:15',
      device: 'Unknown Device',
      location: 'Unknown Location',
      ipAddress: '203.45.67.89',
      status: 'failed'
    },
    {
      id: 5,
      timestamp: '2025-08-29 16:30:45',
      device: 'Windows Desktop',
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      status: 'success'
    }
  ];

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleTwoFactorToggle = (enabled) => {
    if (enabled && !settings?.twoFactorEnabled) {
      setShowTwoFactorSetup(true);
    } else if (!enabled && settings?.twoFactorEnabled) {
      // Disable 2FA
      handleSettingChange('twoFactorEnabled', false);
      setShowTwoFactorSetup(false);
    }
  };

  const handleTwoFactorSetup = async () => {
    if (verificationCode?.length !== 6) {
      alert('Please enter a valid 6-digit verification code');
      return;
    }

    setIsSaving(true);
    
    // Simulate 2FA setup
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    handleSettingChange('twoFactorEnabled', true);
    setShowTwoFactorSetup(false);
    setVerificationCode('');
    setIsSaving(false);
    
    alert('Two-factor authentication has been enabled successfully');
  };

  const handleTerminateSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to terminate this session?')) {
      // Simulate session termination
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Session terminated successfully');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onSave) {
      onSave(settings);
    }
    
    setIsSaving(false);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (device) => {
    if (device?.includes('iPhone') || device?.includes('Android')) return 'Smartphone';
    if (device?.includes('iPad') || device?.includes('Tablet')) return 'Tablet';
    return 'Monitor';
  };

  return (
    <div className="space-y-8">
      {/* Two-Factor Authentication */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Shield" size={20} className="text-success" />
          <h4 className="text-lg font-medium text-foreground">Two-Factor Authentication</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Add an extra layer of security to your account with two-factor authentication
        </p>
        
        <div className="space-y-4">
          <Checkbox
            label="Enable Two-Factor Authentication"
            description="Require a verification code in addition to your password"
            checked={settings?.twoFactorEnabled}
            onChange={(e) => handleTwoFactorToggle(e?.target?.checked)}
          />
          
          {showTwoFactorSetup && (
            <div className="p-4 bg-muted/30 border border-border rounded-md">
              <h5 className="font-medium text-foreground mb-2">Setup Two-Factor Authentication</h5>
              <p className="text-sm text-muted-foreground mb-4">
                Scan the QR code with your authenticator app and enter the 6-digit code below
              </p>
              
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-32 h-32 bg-muted border-2 border-dashed border-border rounded-md flex items-center justify-center">
                  <Icon name="QrCode" size={48} className="text-muted-foreground" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <Input
                    label="Verification Code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e?.target?.value?.replace(/\D/g, '')?.slice(0, 6))}
                    maxLength={6}
                  />
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTwoFactorSetup(false);
                        setVerificationCode('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      loading={isSaving}
                      onClick={handleTwoFactorSetup}
                      disabled={verificationCode?.length !== 6}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Security Preferences */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Settings" size={20} className="text-primary" />
          <h4 className="text-lg font-medium text-foreground">Security Preferences</h4>
        </div>
        
        <div className="space-y-4">
          <Checkbox
            label="Login Notifications"
            description="Receive email notifications for new login attempts"
            checked={settings?.loginNotifications}
            onChange={(e) => handleSettingChange('loginNotifications', e?.target?.checked)}
          />
          
          <Checkbox
            label="Allow Multiple Sessions"
            description="Allow logging in from multiple devices simultaneously"
            checked={settings?.allowMultipleSessions}
            onChange={(e) => handleSettingChange('allowMultipleSessions', e?.target?.checked)}
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Session Timeout</label>
            <select
              value={settings?.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e?.target?.value))}
              className="w-full md:w-auto px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
            <p className="text-xs text-muted-foreground">Automatically log out after period of inactivity</p>
          </div>
        </div>
      </div>
      {/* Active Sessions */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="Activity" size={20} className="text-accent" />
            <h4 className="text-lg font-medium text-foreground">Active Sessions</h4>
          </div>
          <span className="text-sm text-muted-foreground">{activeSessions?.length} active sessions</span>
        </div>
        
        <div className="space-y-3">
          {activeSessions?.map((session) => (
            <div key={session?.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md">
              <div className="flex items-center space-x-3">
                <Icon name={getDeviceIcon(session?.device)} size={20} className="text-muted-foreground" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">{session?.device}</span>
                    {session?.isCurrent && (
                      <span className="px-2 py-1 text-xs bg-success text-success-foreground rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session?.browser} • {session?.location} • {session?.ipAddress}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last active: {formatDateTime(session?.lastActive)}
                  </div>
                </div>
              </div>
              
              {!session?.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTerminateSession(session?.id)}
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Login History */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="History" size={20} className="text-secondary" />
          <h4 className="text-lg font-medium text-foreground">Login History</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Recent login attempts to your account
        </p>
        
        <div className="space-y-2">
          {loginHistory?.map((login) => (
            <div key={login?.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-md transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${login?.status === 'success' ? 'bg-success' : 'bg-error'}`} />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatDateTime(login?.timestamp)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {login?.device} • {login?.location} • {login?.ipAddress}
                  </div>
                </div>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full ${
                login?.status === 'success' ?'bg-success/10 text-success' :'bg-error/10 text-error'
              }`}>
                {login?.status === 'success' ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
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
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettingsTab;
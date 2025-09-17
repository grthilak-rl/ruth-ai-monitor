import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import ProfileInformationTab from './components/ProfileInformationTab';
import NotificationPreferencesTab from './components/NotificationPreferencesTab';
import SecuritySettingsTab from './components/SecuritySettingsTab';
import SystemConfigurationTab from './components/SystemConfigurationTab';
import { useAlerts } from '../../contexts/AlertContext';

const UserProfileSettings = () => {
  const { alertCount } = useAlerts();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile-information');
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile-information', label: 'Profile Information', icon: 'User' },
    { id: 'notification-preferences', label: 'Notification Preferences', icon: 'Bell' },
    { id: 'security-settings', label: 'Security Settings', icon: 'Lock' },
    { id: 'system-configuration', label: 'System Configuration', icon: 'Settings', adminOnly: true },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSaveProfile = (profileData) => {
    console.log('Saving profile data:', profileData);
    // Handle profile save
  };

  const handleSaveNotifications = (notificationData) => {
    console.log('Saving notification preferences:', notificationData);
    // Handle notification preferences save
  };

  const handleSaveSecurity = (securityData) => {
    console.log('Saving security settings:', securityData);
    // Handle security settings save
  };

  const handleSaveSystemConfig = (systemConfigData) => {
    console.log('Saving system configuration:', systemConfigData);
    // Handle system configuration save
  };

  const filteredTabs = tabs.filter(tab => 
    !tab?.adminOnly || (tab?.adminOnly && (user?.role === 'admin' || user?.role === 'system_administrator'))
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/users/me');
        setUser(response.data);
      } catch (err) {
        setErrorUser(err);
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    document.title = 'User Profile & Settings - Industrial Safety Monitor';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        user={user} 
        alertCount={alertCount} 
        onNavigate={handleNavigation}
      />
      <main className="pt-[60px]">
        <div className="p-6">
          <BreadcrumbNavigation 
            items={[
              { name: 'Home', path: '/' },
              { name: 'User Profile & Settings', path: '/user-profile-settings' },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">User Profile & Settings</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-64 bg-card p-4 rounded-lg shadow-md">
              <nav className="space-y-2">
                {filteredTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
                      ${activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon name={tab.icon} size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 bg-card p-6 rounded-lg shadow-md">
              {activeTab === 'profile-information' && (
                <ProfileInformationTab user={user} onSave={handleSaveProfile} />
              )}
              {activeTab === 'notification-preferences' && (
                <NotificationPreferencesTab onSave={handleSaveNotifications} />
              )}
              {activeTab === 'security-settings' && (
                <SecuritySettingsTab onSave={handleSaveSecurity} />
              )}
              {activeTab === 'system-configuration' && (
                <SystemConfigurationTab onSave={handleSaveSystemConfig} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfileSettings;
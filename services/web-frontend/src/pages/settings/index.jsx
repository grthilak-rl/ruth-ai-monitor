import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from '@/components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';

const SettingsPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Settings | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Settings */}
          <Link to="/settings/general" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">General</h2>
                <p className="text-muted-foreground text-sm">Manage application preferences</p>
              </div>
            </div>
          </Link>

          {/* User Management */}
          <Link to="/settings/users" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <Icon name="Users" size={24} className="text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Users</h2>
                <p className="text-muted-foreground text-sm">Add, edit, or remove users</p>
              </div>
            </div>
          </Link>

          {/* Integrations */}
          <Link to="/settings/integrations" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-success/10 rounded-full">
                <Icon name="Plug" size={24} className="text-success" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
                <p className="text-muted-foreground text-sm">Connect with external services</p>
              </div>
            </div>
          </Link>

          {/* Notifications */}
          <Link to="/settings/notifications" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-warning/10 rounded-full">
                <Icon name="Bell" size={24} className="text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                <p className="text-muted-foreground text-sm">Configure alert preferences</p>
              </div>
            </div>
          </Link>

          {/* Security */}
          <Link to="/settings/security" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Icon name="ShieldCheck" size={24} className="text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Security</h2>
                <p className="text-muted-foreground text-sm">Manage security settings</p>
              </div>
            </div>
          </Link>

          {/* About */}
          <Link to="/settings/about" className="block">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-4">
              <div className="p-3 bg-info/10 rounded-full">
                <Icon name="Info" size={24} className="text-info" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">About</h2>
                <p className="text-muted-foreground text-sm">View application information</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
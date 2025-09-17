import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from "@/components/ui/NavigationHeader";
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Switch } from '../../components/ui/Switch';

const SecurityPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Security', path: '/settings/security' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Security | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-foreground mb-4">Authentication</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1">Current Password</label>
              <Input id="currentPassword" type="password" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">New Password</label>
              <Input id="newPassword" type="password" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
              <Input id="confirmPassword" type="password" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Enable Two-Factor Authentication (2FA)</span>
              <Switch />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecurityPage;
import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from "@/components/ui/NavigationHeader";
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';

const NotificationsPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Notifications', path: '/settings/notifications' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Notifications | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-foreground mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="violationAlerts" />
              <label htmlFor="violationAlerts" className="text-sm font-medium text-foreground">Receive alerts for new violations</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="systemUpdates" />
              <label htmlFor="systemUpdates" className="text-sm font-medium text-foreground">Receive system update announcements</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="weeklyReports" />
              <label htmlFor="weeklyReports" className="text-sm font-medium text-foreground">Receive weekly safety reports</label>
            </div>
            <div>
              <label htmlFor="notificationEmail" className="block text-sm font-medium text-foreground mb-1">Notification Email Address</label>
              <Input id="notificationEmail" type="email" defaultValue="your.email@example.com" />
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

export default NotificationsPage;
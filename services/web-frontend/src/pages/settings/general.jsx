import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from "@/components/ui/NavigationHeader";
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from '@/components/ui/Checkbox';
import Select, { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const GeneralSettingsPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'General', path: '/settings/general' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>General Settings | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">General Settings</h1>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-foreground mb-4">Application Preferences</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-foreground mb-1">Application Name</label>
              <Input id="appName" type="text" defaultValue="Industrial Safety Monitor" />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-1">Timezone</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                  <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="darkMode" />
              <label htmlFor="darkMode" className="text-sm font-medium text-foreground">Enable Dark Mode</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emailNotifications" />
              <label htmlFor="emailNotifications" className="text-sm font-medium text-foreground">Receive Email Notifications</label>
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

export default GeneralSettingsPage;
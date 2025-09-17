import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from "@/components/ui/NavigationHeader";
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

const IntegrationsPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Integrations', path: '/settings/integrations' },
  ];

  const integrations = [
    {
      id: 1,
      name: 'Slack',
      description: 'Receive real-time alerts in your Slack channels.',
      icon: 'Slack',
      enabled: true,
    },
    {
      id: 2,
      name: 'Microsoft Teams',
      description: 'Integrate with Microsoft Teams for notifications.',
      icon: 'Microsoft',
      enabled: false,
    },
    {
      id: 3,
      name: 'Jira',
      description: 'Create issues in Jira directly from violations.',
      icon: 'Jira',
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Integrations | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-card p-6 rounded-lg shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-muted rounded-full">
                    <Icon name={integration.icon} size={20} className="text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{integration.name}</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {integration.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch checked={integration.enabled} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default IntegrationsPage;
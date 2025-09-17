import React from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from '@/components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Link } from 'react-router-dom';
import Icon from '@/components/AppIcon';

const AboutPage = () => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'About', path: '/settings/about' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>About | Industrial Safety Monitor</title>
      </Helmet>

      <NavigationHeader />

      <main className="flex-1 p-8 pt-4">
        <BreadcrumbNavigation items={breadcrumbs} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">About Industrial Safety Monitor</h1>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Application Version</h2>
            <p className="text-muted-foreground">v2.1.0</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Build Date</h2>
            <p className="text-muted-foreground">2024-07-30</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">License</h2>
            <p className="text-muted-foreground">Proprietary License</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Developed By</h2>
            <p className="text-muted-foreground">Trae AI</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="text-muted-foreground">support@trae.ai</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Legal Information</h2>
            <p className="text-muted-foreground">
              For terms of service and privacy policy, please refer to our official website.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
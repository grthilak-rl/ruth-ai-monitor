import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/live-monitoring-dashboard';
import CameraManagement from './pages/camera-management';
import ViolationHistory from './pages/violation-history';
import UserProfileSettings from './pages/user-profile-settings';
import AIChatAssistance from './pages/ai-chat-assistance';
import AIChatbotIntegration from './pages/ai-chatbot-integration';
import AnalyticsReports from './pages/analytics-reports';
import NotFound from './pages/NotFound';
import CameraMonitoringPage from './pages/camera-monitoring';
import VASStreamingPage from './pages/vas-streaming';
import SettingsPage from './pages/settings';
import GeneralSettingsPage from './pages/settings/general';
import UserManagementPage from './pages/settings/users';
import IntegrationsPage from './pages/settings/integrations';
import NotificationsPage from './pages/settings/notifications';
import SecurityPage from './pages/settings/security';
import AboutPage from './pages/settings/about';

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/vas-demo" element={<VASStreamingPage />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/camera-management" element={<CameraManagement />} />
      <Route path="/violation-history" element={<ViolationHistory />} />
      <Route path="/user-profile-settings" element={<UserProfileSettings />} />
      <Route path="/ai-chat-assistance" element={<AIChatAssistance />} />
      <Route path="/ai-chatbot-integration" element={<AIChatbotIntegration />} />
      <Route path="/analytics-reports" element={<AnalyticsReports />} />
      <Route path="/camera-monitoring" element={<CameraMonitoringPage />} />
      <Route path="/vas-streaming" element={<VASStreamingPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/general" element={<GeneralSettingsPage />} />
      <Route path="/settings/users" element={<UserManagementPage />} />
      <Route path="/settings/integrations" element={<IntegrationsPage />} />
      <Route path="/settings/notifications" element={<NotificationsPage />} />
      <Route path="/settings/security" element={<SecurityPage />} />
      <Route path="/settings/about" element={<AboutPage />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;

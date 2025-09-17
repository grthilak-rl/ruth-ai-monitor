import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';
import { Button } from '@/components/ui/Button';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const authToken = localStorage.getItem('authToken');
    const userSession = localStorage.getItem('userSession');
    
    if (authToken && userSession) {
      // Redirect to dashboard if already logged in
      navigate('/live-monitoring-dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Industrial Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-2xl p-8">
          {/* Header Section */}
          <LoginHeader />
          
          {/* Form Section */}
          <LoginForm />
          
          {/* Security Badges */}
          <SecurityBadges />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
      <div className="absolute top-1/2 right-20 w-16 h-16 bg-success/10 rounded-full blur-xl" />
    </div>
  );
};

export default LoginPage;
import React from 'react';
import Icon from '@/components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl shadow-lg">
          <Icon name="Shield" size={32} color="var(--color-primary-foreground)" />
        </div>
      </div>

      {/* System Title */}
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Industrial Safety Monitor
      </h1>
      
      {/* Subtitle */}
      <p className="text-muted-foreground text-sm">
        Secure access to real-time safety monitoring system
      </p>
      
      {/* Version Badge */}
      <div className="inline-flex items-center space-x-1 mt-3 px-2 py-1 bg-muted rounded-full">
        <Icon name="Zap" size={12} className="text-accent" />
        <span className="text-xs font-mono text-muted-foreground">v2.1.0</span>
      </div>
    </div>
  );
};

export default LoginHeader;
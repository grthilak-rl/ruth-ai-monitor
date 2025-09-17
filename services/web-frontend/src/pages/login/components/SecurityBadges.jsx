import React from 'react';
import Icon from '@/components/AppIcon';

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: 'Lock',
      label: 'SSL Encrypted',
      description: 'End-to-end encryption'
    },
    {
      icon: 'Shield',
      label: 'ISO 27001',
      description: 'Security certified'
    },
    {
      icon: 'Eye',
      label: 'GDPR Compliant',
      description: 'Privacy protected'
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="grid grid-cols-3 gap-4">
        {securityFeatures?.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-muted rounded-md">
              <Icon name={feature?.icon} size={14} className="text-muted-foreground" />
            </div>
            <div className="text-xs font-medium text-foreground mb-1">
              {feature?.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {feature?.description}
            </div>
          </div>
        ))}
      </div>
      {/* Copyright */}
      <div className="text-center mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © {new Date()?.getFullYear()} Industrial Safety Monitor. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SecurityBadges;
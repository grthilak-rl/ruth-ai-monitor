import React from 'react';

const SignUpHeader = () => {
  return (
    <div className="text-center space-y-2">
      <Icon name="ShieldCheck" className="mx-auto h-12 w-12 text-primary" />
      <h2 className="text-3xl font-bold">Create Your Account</h2>
      <p className="text-muted-foreground">
        Enter your details to get started with Industrial Safety Monitor.
      </p>
    </div>
  );
};

export default SignUpHeader;
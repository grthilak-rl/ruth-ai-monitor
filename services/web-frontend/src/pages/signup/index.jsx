import React from 'react';
import SignUpHeader from './components/SignUpHeader';
import SignUpForm from './components/SignUpForm';
import { Button } from '@/components/ui/Button';

const SignUpPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-lg shadow-lg p-8 space-y-6">
        <SignUpHeader />
        <SignUpForm />
      </div>
    </div>
  );
};

export default SignUpPage;
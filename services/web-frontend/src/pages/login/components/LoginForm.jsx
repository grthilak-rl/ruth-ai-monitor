import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Icon from '@/components/AppIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mock credentials for different user types
  const mockCredentials = [
    {
      email: 'manager@industrial-safety.com',
      password: 'SafetyManager2024',
      role: 'Safety Manager'
    },
    {
      email: 'supervisor@industrial-safety.com',
      password: 'Supervisor2024',
      role: 'Safety Supervisor'
    },
    {
      email: 'admin@industrial-safety.com',
      password: 'Admin2024',
      role: 'System Administrator'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        username: formData.email,
        password: formData.password,
      });

      const { token, refreshToken, user } = response.data;

      console.log('Token received from backend:', token);
      console.log('Refresh token received from backend:', refreshToken);

      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userSession', JSON.stringify(user));

      // Set default axios header for all subsequent requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      navigate('/live-monitoring-dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = () => {
    alert('Password reset functionality would be implemented here.\n\nFor demo purposes, use these credentials:\n\nManager: manager@industrial-safety.com / SafetyManager2024\nSupervisor: supervisor@industrial-safety.com / Supervisor2024\nAdmin: admin@industrial-safety.com / Admin2024');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your work email"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading}
        />

        {/* Password Field */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            value={formData?.password}
            onChange={handleInputChange}
            error={errors?.password}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-150"
            disabled={isLoading}
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
          </button>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            name="rememberMe"
            checked={formData?.rememberMe}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-accent hover:text-accent/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Error */}
        {errors?.submit && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start space-x-2">
              <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{errors?.submit}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          iconName="LogIn"
          iconPosition="right"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="mt-2"
          onClick={() => navigate('/signup')}
          disabled={isLoading}
        >
          Register
        </Button>
      </form>
      {/* Demo Credentials Helper */}
      <div className="mt-8 p-4 bg-muted/50 border border-border rounded-md">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={16} className="text-accent mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Demo Credentials:</p>
            <p>Manager: manager@industrial-safety.com</p>
            <p>Password: SafetyManager2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
import React, { useState, useEffect } from 'react';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const ProfileInformationTab = ({ user, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    role: user?.role || '',
    employeeId: user?.employeeId || '',
    location: user?.location || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        role: user?.role || '',
        employeeId: user?.employeeId || '',
        location: user?.location || '',
      });
    }
  }, [user]);

  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = (event) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e?.target?.result);
      };
      reader?.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (onSave) {
      onSave({ ...formData, avatar });
    }
    
    setIsSaving(false);
    setIsEditing(false);
  };

  const handlePasswordUpdate = async () => {
    if (passwordData?.newPassword !== passwordData?.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setIsSaving(true);
    
    // Simulate password update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setIsSaving(false);
    
    alert('Password updated successfully');
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 p-6 bg-card border border-border rounded-lg">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
            <AppImage
              src={avatar}
              alt="Profile avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {isEditing && (
            <label className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
              <Icon name="Camera" size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground">{formData?.name}</h3>
          <p className="text-muted-foreground">{formData?.role}</p>
          <p className="text-sm text-muted-foreground mt-1">{formData?.department}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Icon name="MapPin" size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{formData?.location}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button
              variant="outline"
              iconName="Edit"
              iconPosition="left"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || 'Sarah Mitchell',
                    email: user?.email || 'sarah.mitchell@industrial-safety.com',
                    phone: user?.phone || '+1 (555) 123-4567',
                    department: user?.department || 'Safety Operations',
                    role: user?.role || 'Senior Safety Manager',
                    employeeId: user?.employeeId || 'EMP-2024-0892',
                    location: user?.location || 'Manufacturing Plant A'
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                loading={isSaving}
                iconName="Save"
                iconPosition="left"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Profile Information Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-foreground">Personal Information</h4>
          
          <Input
            label="Full Name"
            type="text"
            value={formData?.name}
            onChange={(e) => handleInputChange('name', e?.target?.value)}
            disabled={!isEditing}
            required
          />
          
          <Input
            label="Email Address"
            type="email"
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            disabled={!isEditing}
            required
          />
          
          <Input
            label="Phone Number"
            type="tel"
            value={formData?.phone}
            onChange={(e) => handleInputChange('phone', e?.target?.value)}
            disabled={!isEditing}
          />
          
          <Input
            label="Employee ID"
            type="text"
            value={formData?.employeeId}
            disabled
            description="Employee ID cannot be changed"
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-foreground">Work Information</h4>
          
          <Input
            label="Department"
            type="text"
            value={formData?.department}
            onChange={(e) => handleInputChange('department', e?.target?.value)}
            disabled={!isEditing}
          />
          
          <Input
            label="Job Role"
            type="text"
            value={formData?.role}
            onChange={(e) => handleInputChange('role', e?.target?.value)}
            disabled={!isEditing}
          />
          
          <Input
            label="Work Location"
            type="text"
            value={formData?.location}
            onChange={(e) => handleInputChange('location', e?.target?.value)}
            disabled={!isEditing}
          />
          
          <div className="pt-4">
            <Button
              variant="outline"
              iconName="Key"
              iconPosition="left"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              fullWidth
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>
      {/* Password Change Form */}
      {showPasswordForm && (
        <div className="p-6 bg-muted/30 border border-border rounded-lg">
          <h4 className="text-lg font-medium text-foreground mb-4">Change Password</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordData?.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e?.target?.value)}
              required
            />
            
            <Input
              label="New Password"
              type="password"
              value={passwordData?.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e?.target?.value)}
              required
              description="Minimum 8 characters"
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData?.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e?.target?.value)}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              loading={isSaving}
              onClick={handlePasswordUpdate}
              disabled={!passwordData?.currentPassword || !passwordData?.newPassword || !passwordData?.confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInformationTab;
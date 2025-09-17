const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Register a new user
 * @route POST /auth/register
 */
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { username, email, password, first_name, last_name, role } = req.body;

    // Validate role
    const allowedRoles = ['admin', 'operator', 'viewer'];
    const userRole = allowedRoles.includes(role) ? role : 'viewer';

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User Exists',
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password_hash: password, // Will be hashed by hook
      first_name,
      last_name,
      role: userRole
    });

    // Generate JWT tokens
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refreshToken,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to register user' 
    });
  }
};

/**
 * Authenticate user and get token
 * @route POST /auth/login
 */
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findActiveUser(username);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid credentials' 
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT tokens
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to authenticate user' 
    });
  }
};

/**
 * Get current user profile
 * @route GET /auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get user profile' 
    });
  }
};

/**
 * Refresh access token
 * @route POST /auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found or inactive' 
      });
    }

    // Generate new tokens
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid refresh token' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to refresh token' 
    });
  }
};

/**
 * Logout user
 * @route POST /auth/logout
 */
const logout = (req, res) => {
  // In JWT-based auth, logout is handled client-side by removing the token
  // This endpoint is for consistency and potential future server-side token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Update user profile
 * @route PUT /auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ 
          error: 'Email Exists',
          message: 'Email already registered' 
        });
      }
    }

    // Update user
    const updatedUser = await User.update(
      {
        first_name: first_name || req.user.first_name,
        last_name: last_name || req.user.last_name,
        email: email || req.user.email
      },
      { where: { id: userId } }
    );

    if (updatedUser[0] === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }

    // Get updated user
    const user = await User.findByPk(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update profile' 
    });
  }
};

/**
 * Change password
 * @route PUT /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate current password
    const isValidPassword = await req.user.validatePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(400).json({ 
        error: 'Invalid Password',
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    await req.user.update({ password_hash: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to change password' 
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  updateProfile,
  changePassword
};

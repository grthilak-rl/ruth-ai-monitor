const axios = require('axios');

/**
 * Verify JWT token by calling Auth Service
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    // Verify token with Auth Service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
    
    try {
      const response = await axios.get(`${authServiceUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.status === 200 && response.data.success) {
        // Add user info to request
        req.user = response.data.user;
        req.userId = response.data.user.id;
        req.userRole = response.data.user.role;
        next();
      } else {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid token' 
        });
      }
    } catch (authError) {
      if (authError.response?.status === 401) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or expired token' 
        });
      }
      
      console.error('Auth service error:', authError.message);
      return res.status(503).json({ 
        error: 'Service Unavailable',
        message: 'Authentication service unavailable' 
      });
    }
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Token verification failed' 
    });
  }
};

/**
 * Check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin privileges required' 
    });
  }

  next();
};

/**
 * Check if user has operator or admin role
 */
const requireOperator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required' 
    });
  }

  if (!['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Operator privileges required' 
    });
  }

  next();
};

/**
 * Check if user has any of the specified roles
 */
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
        
        try {
          const response = await axios.get(`${authServiceUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 5000
          });

          if (response.status === 200 && response.data.success) {
            req.user = response.data.user;
            req.userId = response.data.user.id;
            req.userRole = response.data.user.role;
          }
        } catch (error) {
          // Continue without authentication
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireOperator,
  requireRoles,
  optionalAuth
};

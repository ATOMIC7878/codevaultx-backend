const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // CRITICAL: Store user.id (string) for consistent comparison
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Store BOTH id (string) and _id (ObjectId) for flexibility
      req.user = {
        id: user._id.toString(), // String version for comparison
        _id: user._id, // ObjectId for database queries
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      console.log(`✅ Auth: User ${req.user.username} (ID: ${req.user.id})`);

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
};

module.exports = { protect, adminOnly };

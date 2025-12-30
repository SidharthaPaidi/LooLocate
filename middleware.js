const Toilet = require('./models/toilet');
const User = require('./models/user')
const jwt = require('jsonwebtoken');

//JWT verification middleware
module.exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports.isLoggedIn = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      // Invalid token, proceed to check session
    }
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Neither JWT nor session found
  return res.status(401).json({
    success: false,
    message: 'You must be signed in first'
  });
};

module.exports.isAdmin = async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin privileges required' 
    });
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const toilet = await Toilet.findById(id);

  if (!toilet) {
    return res.status(404).json({ success: false, message: "Toilet not found" });
  }

  const userId = req.user._id || req.user.id;
  if (!toilet.author || !toilet.author.equals(userId)) {
    return res.status(403).json({ success: false, message: "You do not have permission" });
  }

  next();
};

module.exports.isLoggedInSession = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'You must be signed in first'
    });
  }
  next();
};

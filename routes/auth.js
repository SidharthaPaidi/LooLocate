const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Jwt token generation function
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Generate JWT token and redirect with token
    const token = generateToken(req.user.id);
    // Successful login
    res.redirect(`/toilets?tokens=${token}`);
  }
);
// Register form
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Create account
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;  // name attributes in form
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password); // hashes & saves
    const token = generateToken(registeredUser.id);
  
    res.json({
      success: true,
      message: `Welcome, ${registeredUser.username}!`,
      token: token,
      user: {
        id: registeredUser._id,
        username: registeredUser.username,
        email: registeredUser.email
      }
    });

  } catch (e) {
    let msg = 'Something went wrong';
    // Mongoose duplicate key error (MongoServerError 11000)
    if (e.name === 'MongoServerError' && e.code === 11000 && e.keyValue) {
      const field = Object.keys(e.keyValue)[0];
      msg = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    } else if (e.message && e.message.includes('A user with the given username is already registered')) {
      // passport-local-mongoose username collision
      msg = 'Username already exists';
    } else if (e.message && /email/i.test(e.message)) {
      msg = 'Accound with this email already exists';
    } else if (e.errors) {
      // Mongoose validation errors
      msg = Object.values(e.errors).map(err => err.message).join(', ');
    } else if (e.message) {
      msg = e.message;
    }
    req.flash('error', msg);
    res.redirect('/register');
  }
});

// Login form
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid credentials' 
      });
    }
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Welcome back!',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;

const Users = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { Op } = require('sequelize');

// Initialize OAuth clients
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, process.env.AUTH_TOKEN, { expiresIn: '7d' });
};

// Helper function to set cookie
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
};

// Helper function to find or create user
const findOrCreateUser = async (userData) => {
  const { email, auth_provider, auth_provider_id } = userData;
  
  let user = await Users.findOne({
    where: {
      [Op.or]: [
        { email },
        { auth_provider_id, auth_provider }
      ]
    }
  });

  if (user) {
    await user.update(userData);
  } else {
    user = await Users.create(userData);
  }

  return user;
};

// Google OAuth routes
exports.getGoogleAuthURL = (req, res) => {
  const url = `http://localhost:4000/user/auth/google`;
  res.json({ url });
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      console.error('[googleCallback] error:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    const jwtToken = generateToken(user);
    setAuthCookie(res, jwtToken);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  })(req, res, next);
};

// Facebook OAuth routes
exports.getFacebookAuthURL = (req, res) => {
  const url = `http://localhost:4000/user/auth/facebook`;
  res.json({ url });
};

exports.facebookCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user) => {
    if (err) {
      console.error('[facebookCallback] error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }

    const jwtToken = generateToken(user);
    setAuthCookie(res, jwtToken);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
  })(req, res, next); 
};

// Microsoft OAuth routes
exports.getMicrosoftAuthURL = (req, res) => {
  const url = `http://localhost:4000/user/auth/microsoft`;
  res.json({ url });
};

exports.microsoftCallback = (req, res, next) => {
  passport.authenticate('microsoft', { session: false }, (err, user) => {
    if (err) {
      console.error('[microsoftCallback] error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }

    const jwtToken = generateToken(user);
    setAuthCookie(res, jwtToken);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  })(req, res, next);
}; 
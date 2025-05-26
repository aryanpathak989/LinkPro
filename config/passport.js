const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const Users = require('../models/User');
const { Op } = require('sequelize');

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

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userData = {
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        profile_picture: profile.photos[0].value,
        auth_provider: 'google',
        auth_provider_id: profile.id,
        is_Phone_verified: false
      };

      const user = await findOrCreateUser(userData);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_REDIRECT_URI,
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userData = {
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        profile_picture: profile.photos[0].value,
        auth_provider: 'facebook',
        auth_provider_id: profile.id,
        is_Phone_verified: false
      };

      const user = await findOrCreateUser(userData);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Microsoft Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_REDIRECT_URI,
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log(profile)
    try {
      const userData = {
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        profile_picture: null,
        auth_provider: 'microsoft',
        auth_provider_id: profile.id,
        is_Phone_verified: false
      };

      const user = await findOrCreateUser(userData);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport; 
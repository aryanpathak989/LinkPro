const { sendOtp,
    verifyOtp,
    signup,
    login,
    resetPassword,
    updatePreference,
    updateUserDetails
} = require('../controller/user')
const { 
    getGoogleAuthURL,
    googleCallback,
    getFacebookAuthURL,
    facebookCallback,
    getMicrosoftAuthURL,
    microsoftCallback
} = require('../controller/socialAuth')
const router = require('express').Router()
const {auth} = require('../middleware/auth')
const passport = require('passport')

router.post('/send-otp',sendOtp)
router.post('/verify-otp',verifyOtp)
router.post('/signup',signup)
router.post('/login',login)
router.post('/reset-password',resetPassword)
router.post('/update-details',auth,updateUserDetails)
router.post('/update-preference',auth,updatePreference)

// Social authentication routes
router.get('/auth/google/url', getGoogleAuthURL)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', googleCallback)

router.get('/auth/facebook/url', getFacebookAuthURL)
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }))
router.get('/auth/facebook/callback', facebookCallback)

router.get('/auth/microsoft/url', getMicrosoftAuthURL)
router.get('/auth/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }))
router.get('/auth/microsoft/callback', microsoftCallback)

module.exports = router 

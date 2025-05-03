const { sendOtp,
    verifyOtp,
    signup,
    login,
    resetPassword,
    updatePreference,
    updateUserDetails
} = require('../controller/user')
const router = require('express').Router()
const {auth} = require('../middleware/auth')

router.post('/send-otp',sendOtp)
router.post('/verify-otp',verifyOtp)
router.post("/signup",signup)
router.post("/login",login)
router.post('/resetPassword',resetPassword)
router.post("/update-preference",auth,updatePreference)
router.post('/update-details',auth,updateUserDetails)

module.exports = router 

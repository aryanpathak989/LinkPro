const { sendOtp,verifyOtp,signup,login} = require('../controller/user')
const router = require('express').Router()


router.post('/send-otp',sendOtp)
router.post('/verify-otp',verifyOtp)
router.post("/signup",signup)
router.post("/login",login)

module.exports = router 

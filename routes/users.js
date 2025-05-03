const { sendOtp,verifyOtp } = require('../controller/user')
const router = require('express').Router()


router.post('/send-otp',sendOtp)
router.post('/verify-otp',verifyOtp)

module.exports = router

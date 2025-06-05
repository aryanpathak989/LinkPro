const { urlShortner, getActualUrl,updateUrlDetails } = require('../controller/urlShorterhandler')
const router = require('express').Router()
const { auth } = require('../middleware/auth')


router.post("/create",auth,urlShortner)
router.post("/update",auth,updateUrlDetails)

module.exports = router

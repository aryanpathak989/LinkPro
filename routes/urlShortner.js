const { urlShortner, getActualUrl,updateUrlDetails } = require('../controller/urlShorterhandler')
const router = require('express').Router()


router.post("/create",urlShortner)
router.post("/update",updateUrlDetails)

module.exports = router

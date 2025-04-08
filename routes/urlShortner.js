const { urlShortner, getActualUrl } = require('../controller/urlShorterhandler')
const router = require('express').Router()


router.post("/url/create",urlShortner)
router.get("/:url",getActualUrl)

module.exports = router

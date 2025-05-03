const { urlShortner, getActualUrl } = require('../controller/urlShorterhandler')
const router = require('express').Router()


router.get("/:url",getActualUrl)

module.exports = router
const express = require('express');
const router = express.Router();
const { getOverview,getOverview2, listUrls,getUrlAnalyticsById } = require('../controller/overviewHandler');
const { auth } = require('../middleware/auth');

router.get('/overview', auth, getOverview2);
router.get('/list', auth, listUrls);
router.get("/url-details",auth,getUrlAnalyticsById)

module.exports = router;
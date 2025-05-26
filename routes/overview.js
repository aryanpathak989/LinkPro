const express = require('express');
const router = express.Router();
const { getOverview, listUrls,getUrlAnalyticsById } = require('../controller/overviewHandler');
const { auth } = require('../middleware/auth');

router.get('/overview', auth, getOverview);
router.get('/list', auth, listUrls);
router.get("/url-details",auth,getUrlAnalyticsById)

module.exports = router; 
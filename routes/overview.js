const express = require('express');
const router = express.Router();
const { getOverview, listUrls } = require('../controller/overviewHandler');
const { auth } = require('../middleware/auth');

router.get('/overview', auth, getOverview);
router.get('/list', auth, listUrls);

module.exports = router; 
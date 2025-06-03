const router = require('express').Router()
const {getLinkClickPerformance,getLinkDeviceBreakDown,getLinkReferencePerformance,getLinkClicksByCountry} = require('../controller/linkHandler');
const { auth } = require('../middleware/auth');

router.get("/getLinkClickPerformance",auth,getLinkClickPerformance)
router.get("/getLinkDeviceBreakDown",auth,getLinkDeviceBreakDown)
router.get("/getLinkReferencePerformance",auth,getLinkReferencePerformance)
router.get("/getLinkClicksByCountry",auth,getLinkClicksByCountry)

module.exports = router; 
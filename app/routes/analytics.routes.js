const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller.js');

router.get('/patient/:patientId', analyticsController.getPatientAnalytics);

module.exports = router;

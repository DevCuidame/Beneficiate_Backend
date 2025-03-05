const plansController = require('./plans.controller');
const express = require('express');
const router = express.Router();

router.get('/all', plansController.getAllPlans);

module.exports = router;


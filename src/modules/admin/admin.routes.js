const express = require('express');
const router = express.Router();
const useAdminController = require('./admin.controller');

router.get('/users', useAdminController.getAllUsers);
router.get('/plans', useAdminController.getAllPlans);
router.post('/plan', useAdminController.createPlan);

module.exports = router;
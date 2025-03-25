const express = require('express');
const router = express.Router();
const { getByUserId, createRecord, updateRecord, removeRecord } = require('./vaccinations.controller');
const validate = require('../../../middlewares/validate.middleware');
const { userVaccinationsSchema } = require('../health/user.health.validation');

router.get('/user/:user_id', getByUserId);
router.post('/create', validate(userVaccinationsSchema), createRecord);
// router.put('/update/:id', validate(userVaccinationSchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;
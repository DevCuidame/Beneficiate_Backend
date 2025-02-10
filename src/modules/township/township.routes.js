const express = require('express');
const router = express.Router();
const {
  getTownshipsByDepartment,
  getAllDepartments,
} = require('./township.controller');

router.get('/departments', getAllDepartments);
router.get('/:departmentId', getTownshipsByDepartment);

module.exports = router;

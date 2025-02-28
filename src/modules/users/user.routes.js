const express = require('express');
const router = express.Router();
const {
  findByEmail,
  getUserById,
  findByIdentification
} = require('./user.controller');


// router.get('/email/:email', findByEmail);
// router.get('/id/:id', getUserById);

router.get('/identification/:identification_type/:identification_number', findByIdentification);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  findByEmail,
  getUserById,
  findByIdentification,
  updateUser,
} = require('./user.controller');

const { userUpdateSchema } = require('./user.validation');
const validate  = require('../../core/validation');

// router.get('/email/:email', findByEmail);
// router.get('/id/:id', getUserById);

router.get(
  '/identification/:identification_type/:identification_number',
  findByIdentification
);
router.put('/update/:id', validate(userUpdateSchema), updateUser);

module.exports = router;

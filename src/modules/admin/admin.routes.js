//TODO: Toca agregar autenticacion de administrador

const express = require('express');
const router = express.Router();
const { getAllUsers } = require('./admin.controller');

router.get('/users', getAllUsers);

module.exports = router;
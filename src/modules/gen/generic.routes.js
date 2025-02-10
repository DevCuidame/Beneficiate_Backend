// generic.routes.js
const express = require('express');

function createRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.get('beneficiary/:id', controller.findByBeneficiary);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);
  return router;
}

module.exports = createRoutes;
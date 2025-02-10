// GenericController.js
const { successResponse, errorResponse } = require('../../core/responses');

class GenericController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res) => {
    try {
      const data = await this.service.getAll();
      successResponse(res, data, 'Registros recuperados exitosamente');
    } catch (error) {
      errorResponse(res, error);
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const data = await this.service.getById(id);
      if (!data) return res.status(404).json({ message: 'Registro no encontrado' });
      successResponse(res, data, 'Registro encontrado');
    } catch (error) {
      errorResponse(res, error);
    }
  };

  findByBeneficiary = async (req, res) => {
    try {
      const { id } = req.params;
      const data = await this.service.findByBeneficiary(id);
      if (!data) return res.status(404).json({ message: 'Registro no encontrado' });
      successResponse(res, data, 'Registro encontrado');
    } catch (error) {
      errorResponse(res, error);
    }
  };

  create = async (req, res) => {
    try {
      const data = await this.service.create(req.body);
      successResponse(res, data, 'Registro creado exitosamente');
    } catch (error) {
      errorResponse(res, error);
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = await this.service.update(id, req.body);
      successResponse(res, data, 'Registro actualizado exitosamente');
    } catch (error) {
      errorResponse(res, error);
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      successResponse(res, null, 'Registro eliminado exitosamente');
    } catch (error) {
      errorResponse(res, error);
    }
  };
}

module.exports = GenericController;

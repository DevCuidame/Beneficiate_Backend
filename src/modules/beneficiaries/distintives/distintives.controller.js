const service = require('../../gen/generic.service');
const { successResponse, errorResponse } = require('../../../core/responses');

const getByBeneficiaryId = async (req, res) => {
  try {
    const { beneficiary_id } = req.params;
    const records = await service.getByBeneficiaryId('beneficiary_distintives', beneficiary_id);
    successResponse(res, records, 'Registros recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const createRecord = async (req, res) => {
  try {
    const record = await service.createRecord('beneficiary_distintives', req.body);
    successResponse(res, record, 'Registro creado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecord = await service.updateRecord('beneficiary_distintives', id, req.body);
    successResponse(res, updatedRecord, 'Registro actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await service.removeRecord('beneficiary_distintives', id);
    successResponse(res, null, 'Registro eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getByBeneficiaryId,
  createRecord,
  updateRecord,
  removeRecord,
};
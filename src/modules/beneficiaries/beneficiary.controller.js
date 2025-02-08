const beneficiaryService = require('../beneficiaries/beneficiary.service');
const { successResponse, errorResponse } = require('../../core/responses');

const getBeneficiaryByIdentification = async (req, res) => {
  try {
    const { identification_number } = req.params;
    const beneficiary = await beneficiaryService.getBeneficiaryByIdentification(identification_number);
    successResponse(res, beneficiary, 'Beneficiario recuperado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getBeneficiariesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const beneficiaries = await beneficiaryService.getBeneficiariesByUser(user_id);
    successResponse(res, beneficiaries, 'Beneficiarios recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const createBeneficiary = async (req, res) => {
  try {
    const beneficiary = await beneficiaryService.createBeneficiary(req.body);
    successResponse(res, beneficiary, 'Beneficiario creado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBeneficiary = await beneficiaryService.updateBeneficiary(id, req.body);
    successResponse(res, updatedBeneficiary, 'Beneficiario actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    await beneficiaryService.removeBeneficiary(id);
    successResponse(res, null, 'Beneficiario eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getBeneficiaryByIdentification,
  getBeneficiariesByUser,
  createBeneficiary,
  updateBeneficiary,
  removeBeneficiary
};

const service = require('../../gen/generic.service');
const { successResponse, errorResponse } = require('../../../core/responses');

const getByBeneficiaryId = async (req, res) => {
  try {
    const { beneficiary_id } = req.params;
    const records = await service.getByBeneficiaryId('beneficiary_vaccinations', beneficiary_id);
    successResponse(res, records, 'Registros recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const createRecord = async (req, res) => {
  try {
    const { vaccinations } = req.body;

    if (!Array.isArray(vaccinations) || vaccinations.length === 0) {
      return errorResponse(res, { message: 'El array de vacunaciones es requerido y no puede estar vacío' }, 400);
    }

    const beneficiaryId = vaccinations[0].beneficiary_id;
    const existingRecords = await service.getByBeneficiaryId('beneficiary_vaccinations', beneficiaryId);

    const newVaccinationKeys = vaccinations.map(v => `${v.vaccine}-${v.vaccination_date}`);

    const recordsToDelete = existingRecords.filter(v => !newVaccinationKeys.includes(`${v.vaccine}-${v.vaccination_date}`));
    for (const record of recordsToDelete) {
      await service.removeRecord('beneficiary_vaccinations', record.id );
    }

    for (const vaccination of vaccinations) {
      const exists = existingRecords.some(v => v.vaccine === vaccination.vaccine && v.vaccination_date === vaccination.vaccination_date);

      if (!exists) {
        await service.createRecord('beneficiary_vaccinations', vaccination);
      }
    }

    successResponse(res, { message: 'Registros actualizados correctamente' });
  } catch (error) {
    errorResponse(res, error);
  }
};


const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecord = await service.updateRecord('beneficiary_vaccinations', id, req.body);
    successResponse(res, updatedRecord, 'Registro actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await service.removeRecord('beneficiary_vaccinations', id);
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

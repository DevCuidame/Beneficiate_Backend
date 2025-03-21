const service = require('../../gen/generic.service');
const { successResponse, errorResponse } = require('../../../core/responses');

const getByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const records = await service.getByUserId('user_vaccinations', user_id);
    successResponse(res, records, 'Vacunaciones recuperadas exitosamente');
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

    const userId = vaccinations[0].user_id;
    const existingRecords = await service.getByUserId('user_vaccinations', userId);

    const newVaccinationIds = vaccinations.map(v => v.id).filter(id => id !== undefined);

    const recordsToDelete = existingRecords.filter(v => !newVaccinationIds.includes(v.id));
    for (const record of recordsToDelete) {
      await service.removeRecord('user_vaccinations', record.id);
    }

    // Insertar nuevos registros
    for (const vaccination of vaccinations) {
      if (!vaccination.id) {
        await service.createRecord('user_vaccinations', vaccination);
      }
    }

    // Obtener TODAS las vacunas actualizadas y ordenarlas por `vaccination_date`
    const updatedVaccinations = await service.getByUserIdOrdered('user_vaccinations', userId, 'vaccination_date');

    successResponse(res, { 
      message: 'Vacunaciones actualizadas correctamente', 
      vaccinations: updatedVaccinations 
    });

  } catch (error) {
    errorResponse(res, error);
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecord = await service.updateRecord('user_vaccinations', id, req.body);
    successResponse(res, updatedRecord, 'Vacunación actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await service.removeRecord('user_vaccinations', id);
    successResponse(res, null, 'Vacunación eliminada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getByUserId,
  createRecord,
  updateRecord,
  removeRecord,
};
const beneficiaryService = require('../beneficiaries/beneficiary.service');
const service = require('../gen/generic.service');
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



const createMedicalFamilyHistory = async (req, res) => {
  try {
    const { medicalHistory = [], familyHistory = [] } = req.body;

    if ((!Array.isArray(medicalHistory) || medicalHistory.length === 0) &&
        (!Array.isArray(familyHistory) || familyHistory.length === 0)) {
      return errorResponse(res, { message: 'El historial médico y familiar no pueden estar vacíos' }, 400);
    }

    const beneficiaryId = medicalHistory.length > 0 ? medicalHistory[0].beneficiary_id : familyHistory[0].beneficiary_id;

    // Obtener registros actuales
    const existingMedicalRecords = await service.getByBeneficiaryId('beneficiary_medical_history', beneficiaryId);
    const existingFamilyRecords = await service.getByBeneficiaryId('beneficiary_family_history', beneficiaryId);

    // Obtener IDs de nuevos registros
    const newMedicalIds = medicalHistory.map(h => h.id).filter(id => id !== undefined);
    const newFamilyIds = familyHistory.map(h => h.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteMedical = existingMedicalRecords.filter(h => !newMedicalIds.includes(h.id));
    for (const record of recordsToDeleteMedical) {
      await service.removeRecord('beneficiary_medical_history', record.id);
    }

    const recordsToDeleteFamily = existingFamilyRecords.filter(h => !newFamilyIds.includes(h.id));
    for (const record of recordsToDeleteFamily) {
      await service.removeRecord('beneficiary_family_history', record.id);
    }

    // Insertar nuevos registros
    for (const history of medicalHistory) {
      if (!history.id) {
        await service.createRecord('beneficiary_medical_history', history);
      }
    }

    for (const history of familyHistory) {
      if (!history.id) {
        await service.createRecord('beneficiary_family_history', history);
      }
    }

    const updatedMedicalHistory = await service.getByBeneficiaryIdOrdered('beneficiary_medical_history', beneficiaryId, 'history_date');
    const updatedFamilyHistory = await service.getByBeneficiaryIdOrdered('beneficiary_family_history', beneficiaryId, 'history_date');

    successResponse(res, { 
      message: 'Historial médico y familiar actualizados correctamente',
      medicalHistory: updatedMedicalHistory,
      familyHistory: updatedFamilyHistory
    });

  } catch (error) {
    errorResponse(res, error);
  }
};


const createHealthData = async (req, res) => {
  try {
    const { diseases = [], disabilities = [], distinctives = [] } = req.body;

    if ((!Array.isArray(diseases) || diseases.length === 0) &&
        (!Array.isArray(disabilities) || disabilities.length === 0) &&
        (!Array.isArray(distinctives) || distinctives.length === 0)) {
      return errorResponse(res, { message: 'Debe haber al menos un registro de enfermedades, discapacidades o distintivos' }, 400);
    }

    const beneficiaryId = diseases.length > 0 ? diseases[0].beneficiary_id :
                          disabilities.length > 0 ? disabilities[0].beneficiary_id :
                          distinctives[0].beneficiary_id;

    // Obtener registros actuales de la base de datos
    const existingDiseases = await service.getByBeneficiaryId('beneficiary_diseases', beneficiaryId);
    const existingDisabilities = await service.getByBeneficiaryId('beneficiary_disabilities', beneficiaryId);
    const existingDistinctives = await service.getByBeneficiaryId('beneficiary_distinctives', beneficiaryId);

    // Obtener IDs de nuevos registros
    const newDiseaseIds = diseases.map(d => d.id).filter(id => id !== undefined);
    const newDisabilityIds = disabilities.map(d => d.id).filter(id => id !== undefined);
    const newDistinctiveIds = distinctives.map(d => d.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteDiseases = existingDiseases.filter(d => !newDiseaseIds.includes(d.id));
    for (const record of recordsToDeleteDiseases) {
      await service.removeRecord('beneficiary_diseases', record.id);
    }

    const recordsToDeleteDisabilities = existingDisabilities.filter(d => !newDisabilityIds.includes(d.id));
    for (const record of recordsToDeleteDisabilities) {
      await service.removeRecord('beneficiary_disabilities', record.id);
    }

    const recordsToDeleteDistinctives = existingDistinctives.filter(d => !newDistinctiveIds.includes(d.id));
    for (const record of recordsToDeleteDistinctives) {
      await service.removeRecord('beneficiary_distinctives', record.id);
    }

    // Insertar nuevos registros
    for (const disease of diseases) {
      if (!disease.id) {
        await service.createRecord('beneficiary_diseases', disease);
      }
    }

    for (const disability of disabilities) {
      if (!disability.id) {
        await service.createRecord('beneficiary_disabilities', disability);
      }
    }

    for (const distinctive of distinctives) {
      if (!distinctive.id) {
        await service.createRecord('beneficiary_distinctives', distinctive);
      }
    }

    // Obtener todos los registros actualizados y ordenarlos
    const updatedDiseases = await service.getByBeneficiaryIdOrdered('beneficiary_diseases', beneficiaryId, 'diagnosed_date');
    const updatedDisabilities = await service.getByBeneficiaryIdOrdered('beneficiary_disabilities', beneficiaryId, 'diagnosed_date');
    const updatedDistinctives = await service.getByBeneficiaryIdOrdered('beneficiary_distinctives', beneficiaryId, 'created_at');

    successResponse(res, { 
      message: 'Datos de salud actualizados correctamente',
      diseases: updatedDiseases,
      disabilities: updatedDisabilities,
      distinctives: updatedDistinctives
    });

  } catch (error) {
    errorResponse(res, error);
  }
};



const createAllergiesAndMedications = async (req, res) => {
  try {
    const { allergies = [], medications = [] } = req.body;

    if ((!Array.isArray(allergies) || allergies.length === 0) &&
        (!Array.isArray(medications) || medications.length === 0)) {
      return errorResponse(res, { message: 'Debe haber al menos un registro de alergias o medicamentos' }, 400);
    }

    const beneficiaryId = allergies.length > 0 ? allergies[0].beneficiary_id : medications[0].beneficiary_id;

    // Obtener registros actuales
    const existingAllergies = await service.getByBeneficiaryId('beneficiary_allergies', beneficiaryId);
    const existingMedications = await service.getByBeneficiaryId('beneficiary_medications', beneficiaryId);

    // Obtener IDs de nuevos registros
    const newAllergyIds = allergies.map(a => a.id).filter(id => id !== undefined);
    const newMedicationIds = medications.map(m => m.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteAllergies = existingAllergies.filter(a => !newAllergyIds.includes(a.id));
    for (const record of recordsToDeleteAllergies) {
      await service.removeRecord('beneficiary_allergies', record.id);
    }

    const recordsToDeleteMedications = existingMedications.filter(m => !newMedicationIds.includes(m.id));
    for (const record of recordsToDeleteMedications) {
      await service.removeRecord('beneficiary_medications', record.id);
    }

    // Insertar nuevos registros si no existen
    for (const allergy of allergies) {
      if (!allergy.id) {
        await service.createRecord('beneficiary_allergies', allergy);
      }
    }

    for (const medication of medications) {
      if (!medication.id) {
        await service.createRecord('beneficiary_medications', medication);
      }
    }

    // Obtener todos los registros actualizados y ordenarlos
    const updatedAllergies = await service.getByBeneficiaryIdOrdered('beneficiary_allergies', beneficiaryId, 'created_at');
    const updatedMedications = await service.getByBeneficiaryIdOrdered('beneficiary_medications', beneficiaryId, 'created_at');

    successResponse(res, { 
      message: 'Alergias y medicamentos actualizados correctamente',
      allergies: updatedAllergies,
      medications: updatedMedications
    });

  } catch (error) {
    errorResponse(res, error);
  }
};




module.exports = {
  getBeneficiaryByIdentification,
  getBeneficiariesByUser,
  createBeneficiary,
  updateBeneficiary,
  removeBeneficiary,
  createMedicalFamilyHistory,
  createHealthData,
  createAllergiesAndMedications
};

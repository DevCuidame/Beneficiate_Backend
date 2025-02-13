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
    const { medicalHistory= [], familyHistory= [] } = req.body;

    if ((!Array.isArray(medicalHistory) || medicalHistory.length === 0) &&
        (!Array.isArray(familyHistory) || familyHistory.length === 0)) {
      return errorResponse(res, { message: 'El historial médico y familiar no pueden estar vacíos' }, 400);
    }

    const beneficiaryId = medicalHistory.length > 0 ? medicalHistory[0].beneficiary_id : familyHistory[0].beneficiary_id;

    // Obtener registros actuales de la base de datos
    const existingMedicalRecords = await service.getByBeneficiaryId('beneficiary_medical_history', beneficiaryId);
    const existingFamilyRecords = await service.getByBeneficiaryId('beneficiary_family_history', beneficiaryId);

    // Identificar qué registros deben mantenerse y cuáles eliminar
    const newMedicalKeys = medicalHistory.map(h => `${h.history_type}-${h.history_date}`);
    const newFamilyKeys = familyHistory.map(h => `${h.history_type}-${h.relationship}-${h.history_date}`);

    // Eliminar registros que ya no están en la solicitud
    const recordsToDeleteMedical = existingMedicalRecords.filter(h => !newMedicalKeys.includes(`${h.history_type}-${h.history_date}`));
    for (const record of recordsToDeleteMedical) {
      await service.removeRecord('beneficiary_medical_history', record.id);
    }

    const recordsToDeleteFamily = existingFamilyRecords.filter(h => !newFamilyKeys.includes(`${h.history_type}-${h.relationship}-${h.history_date}`));
    for (const record of recordsToDeleteFamily) {
      await service.removeRecord('beneficiary_family_history', record.id);
    }

    // Insertar nuevos registros si no existen
    for (const history of medicalHistory) {
      const exists = existingMedicalRecords.some(h => h.history_type === history.history_type && h.history_date === history.history_date);
      if (!exists) {
        await service.createRecord('beneficiary_medical_history', history);
      }
    }

    for (const history of familyHistory) {
      const exists = existingFamilyRecords.some(h => h.history_type === history.history_type && h.relationship === history.relationship && h.history_date === history.history_date);
      if (!exists) {
        await service.createRecord('beneficiary_family_history', history);
      }
    }

    successResponse(res, { message: 'Historial médico y familiar actualizados correctamente' });
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
    const existingdistinctives = await service.getByBeneficiaryId('beneficiary_distinctives', beneficiaryId);

    // Identificar qué registros deben mantenerse y cuáles eliminar
    const newDiseaseKeys = diseases.map(d => `${d.disease_name}-${d.diagnosis_date}`);
    const newDisabilityKeys = disabilities.map(d => `${d.disability_type}-${d.diagnosis_date}`);
    const newDistintiveKeys = distinctives.map(d => `${d.distintive_name}`);

    // Eliminar registros que ya no están en la solicitud
    const recordsToDeleteDiseases = existingDiseases.filter(d => !newDiseaseKeys.includes(`${d.disease_name}-${d.diagnosis_date}`));
    for (const record of recordsToDeleteDiseases) {
      await service.removeRecord('beneficiary_diseases', record.id);
    }

    const recordsToDeleteDisabilities = existingDisabilities.filter(d => !newDisabilityKeys.includes(`${d.disability_type}-${d.diagnosis_date}`));
    for (const record of recordsToDeleteDisabilities) {
      await service.removeRecord('beneficiary_disabilities', record.id);
    }

    const recordsToDeletedistinctives = existingdistinctives.filter(d => !newDistintiveKeys.includes(`${d.distintive_name}`));
    for (const record of recordsToDeletedistinctives) {
      await service.removeRecord('beneficiary_distinctives', record.id);
    }

    // Insertar nuevos registros si no existen
    for (const disease of diseases) {
      const exists = existingDiseases.some(d => d.disease_name === disease.disease_name && d.diagnosis_date === disease.diagnosis_date);
      if (!exists) {
        await service.createRecord('beneficiary_diseases', disease);
      }
    }

    for (const disability of disabilities) {
      const exists = existingDisabilities.some(d => d.disability_type === disability.disability_type && d.diagnosis_date === disability.diagnosis_date);
      if (!exists) {
        await service.createRecord('beneficiary_disabilities', disability);
      }
    }

    for (const distintive of distinctives) {
      const exists = existingdistinctives.some(d => d.distintive_name === distintive.distintive_name);
      if (!exists) {
        await service.createRecord('beneficiary_distinctives', distintive);
      }
    }

    successResponse(res, { message: 'Datos de salud actualizados correctamente' });
  } catch (error) {
    errorResponse(res, error);
  }
};


const createAllergiesAndMedications = async (req, res) => {
  try {
    const { allergies= [], medications= [] } = req.body;

    if ((!Array.isArray(allergies) || allergies.length === 0) &&
        (!Array.isArray(medications) || medications.length === 0)) {
      return errorResponse(res, { message: 'Debe haber al menos un registro de alergias o medicamentos' }, 400);
    }

    const beneficiaryId = allergies.length > 0 ? allergies[0].beneficiary_id : medications[0].beneficiary_id;

    // Obtener registros actuales de la base de datos
    const existingAllergies = await service.getByBeneficiaryId('beneficiary_allergies', beneficiaryId);
    const existingMedications = await service.getByBeneficiaryId('beneficiary_medications', beneficiaryId);

    // Identificar qué registros deben mantenerse y cuáles eliminar
    const newAllergyKeys = allergies.map(a => `${a.allergy_name}-${a.reaction}`);
    const newMedicationKeys = medications.map(m => `${m.medication_name}-${m.dosage}`);

    // Eliminar registros que ya no están en la solicitud
    const recordsToDeleteAllergies = existingAllergies.filter(a => !newAllergyKeys.includes(`${a.allergy_name}-${a.reaction}`));
    for (const record of recordsToDeleteAllergies) {
      await service.removeRecord('beneficiary_allergies', record.id);
    }

    const recordsToDeleteMedications = existingMedications.filter(m => !newMedicationKeys.includes(`${m.medication_name}-${m.dosage}`));
    for (const record of recordsToDeleteMedications) {
      await service.removeRecord('beneficiary_medications', record.id);
    }

    // Insertar nuevos registros si no existen
    for (const allergy of allergies) {
      const exists = existingAllergies.some(a => a.allergy_name === allergy.allergy_name && a.reaction === allergy.reaction);
      if (!exists) {
        await service.createRecord('beneficiary_allergies', allergy);
      }
    }

    for (const medication of medications) {
      const exists = existingMedications.some(m => m.medication_name === medication.medication_name && m.dosage === medication.dosage);
      if (!exists) {
        await service.createRecord('beneficiary_medications', medication);
      }
    }

    successResponse(res, { message: 'Alergias y medicamentos actualizados correctamente' });
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

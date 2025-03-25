const userRepository = require('../user.repository');
const service = require('../../gen/generic.service');
const { ValidationError, NotFoundError } = require('../../../core/errors');
const { formatDatesInData } = require('../../../utils/date.util');
const pool = require('../../../config/connection');

/**
 * Obtiene los datos de salud de un usuario
 * @param {number} user_id - ID del usuario
 * @returns {Promise<Object>} - Datos de salud del usuario
 */
const getUserHealthData = async (user_id) => {
  try {
    const query = `
      SELECT 
        COALESCE(d.distinctives, '[]') AS distinctives,
        COALESCE(di.disabilities, '[]') AS disabilities,
        COALESCE(a.allergies, '[]') AS allergies, 
        COALESCE(dz.diseases, '[]') AS diseases, 
        COALESCE(fh.family_history, '[]') AS family_history, 
        COALESCE(hm.medical_history, '[]') AS medical_history, 
        COALESCE(m.medications, '[]') AS medications, 
        COALESCE(v.vaccinations, '[]') AS vaccinations
      FROM users u
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'description', description,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS distinctives
        FROM user_distinctives 
        GROUP BY user_id
      ) d ON u.id = d.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'name', name,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS disabilities
        FROM user_disabilities 
        GROUP BY user_id
      ) di ON u.id = di.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'allergy_type', allergy_type,
            'description', description,
            'severity', severity,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS allergies 
        FROM user_allergies 
        GROUP BY user_id
      ) a ON u.id = a.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'disease', disease,
            'diagnosed_date', diagnosed_date,
            'treatment_required', treatment_required,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS diseases 
        FROM user_diseases 
        GROUP BY user_id
      ) dz ON u.id = dz.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'history_type', history_type,
            'relationship', relationship,
            'description', description,
            'history_date', history_date,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS family_history 
        FROM user_family_history 
        GROUP BY user_id
      ) fh ON u.id = fh.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'history_type', history_type,
            'description', description,
            'history_date', history_date,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS medical_history 
        FROM user_medical_history 
        GROUP BY user_id
      ) hm ON u.id = hm.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'medication', medication,
            'laboratory', laboratory,
            'prescription', prescription,
            'dosage', dosage,
            'frequency', frequency,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS medications 
        FROM user_medications 
        GROUP BY user_id
      ) m ON u.id = m.user_id
      LEFT JOIN (
        SELECT user_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'vaccine', vaccine,
            'vaccination_date', vaccination_date,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS vaccinations 
        FROM user_vaccinations 
        GROUP BY user_id
      ) v ON u.id = v.user_id
      WHERE u.id = $1;
    `;

    const { rows } = await pool.query(query, [user_id]);

    if (!rows.length) return null;

    return formatDatesInData(rows[0], [
      'diagnosed_date',
      'history_date',
      'vaccination_date',
      'created_at',
      'updated_at',
    ]);
  } catch (error) {
    console.error('Error al obtener datos de salud del usuario:', error);
    throw error;
  }
};

/**
 * Crea o actualiza el historial médico y familiar de un usuario
 * @param {Object} data - Datos de historial médico y familiar
 * @returns {Promise<Object>} - Historial actualizado
 */
const createMedicalFamilyHistory = async (data) => {
  try {
    const { medicalHistory = [], familyHistory = [], user_id } = data;

    if ((!Array.isArray(medicalHistory) || medicalHistory.length === 0) &&
        (!Array.isArray(familyHistory) || familyHistory.length === 0)) {
      throw new ValidationError('El historial médico y familiar no pueden estar vacíos');
    }

    // Verificar si el usuario existe
    const user = await userRepository.getUserById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Obtener registros actuales
    const existingMedicalRecords = await getByUserId('user_medical_history', user_id);
    const existingFamilyRecords = await getByUserId('user_family_history', user_id);

    // Obtener IDs de nuevos registros
    const newMedicalIds = medicalHistory.map(h => h.id).filter(id => id !== undefined);
    const newFamilyIds = familyHistory.map(h => h.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteMedical = existingMedicalRecords.filter(h => !newMedicalIds.includes(h.id));
    for (const record of recordsToDeleteMedical) {
      await service.removeRecord('user_medical_history', record.id);
    }

    const recordsToDeleteFamily = existingFamilyRecords.filter(h => !newFamilyIds.includes(h.id));
    for (const record of recordsToDeleteFamily) {
      await service.removeRecord('user_family_history', record.id);
    }

    // Actualizar registros existentes e insertar nuevos
    for (const history of medicalHistory) {
      if (history.id) {
        // Actualizar registro existente
        await service.updateRecord('user_medical_history', history.id, {
          ...history,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_medical_history', {
          ...history,
          user_id
        });
      }
    }

    for (const history of familyHistory) {
      if (history.id) {
        // Actualizar registro existente
        await service.updateRecord('user_family_history', history.id, {
          ...history,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_family_history', {
          ...history,
          user_id
        });
      }
    }

    const updatedMedicalHistory = await getByUserIdOrdered('user_medical_history', user_id, 'history_date');
    const updatedFamilyHistory = await getByUserIdOrdered('user_family_history', user_id, 'history_date');

    return { 
      medicalHistory: updatedMedicalHistory,
      familyHistory: updatedFamilyHistory
    };
  } catch (error) {
    console.error('Error en createMedicalFamilyHistory:', error);
    throw error;
  }
};

/**
 * Crea o actualiza datos de salud del usuario (enfermedades, discapacidades, distintivos)
 * @param {Object} data - Datos de salud
 * @returns {Promise<Object>} - Datos de salud actualizados
 */
const createHealthData = async (data) => {
  try {
    const { diseases = [], disabilities = [], distinctives = [], user_id } = data;

    if ((!Array.isArray(diseases) || diseases.length === 0) &&
        (!Array.isArray(disabilities) || disabilities.length === 0) &&
        (!Array.isArray(distinctives) || distinctives.length === 0)) {
      throw new ValidationError('Debe haber al menos un registro de enfermedades, discapacidades o distintivos');
    }

    // Verificar si el usuario existe
    const user = await userRepository.getUserById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Obtener registros actuales
    const existingDiseases = await getByUserId('user_diseases', user_id);
    const existingDisabilities = await getByUserId('user_disabilities', user_id);
    const existingDistinctives = await getByUserId('user_distinctives', user_id);

    // Obtener IDs de nuevos registros
    const newDiseaseIds = diseases.map(d => d.id).filter(id => id !== undefined);
    const newDisabilityIds = disabilities.map(d => d.id).filter(id => id !== undefined);
    const newDistinctiveIds = distinctives.map(d => d.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteDiseases = existingDiseases.filter(d => !newDiseaseIds.includes(d.id));
    for (const record of recordsToDeleteDiseases) {
      await service.removeRecord('user_diseases', record.id);
    }

    const recordsToDeleteDisabilities = existingDisabilities.filter(d => !newDisabilityIds.includes(d.id));
    for (const record of recordsToDeleteDisabilities) {
      await service.removeRecord('user_disabilities', record.id);
    }

    const recordsToDeleteDistinctives = existingDistinctives.filter(d => !newDistinctiveIds.includes(d.id));
    for (const record of recordsToDeleteDistinctives) {
      await service.removeRecord('user_distinctives', record.id);
    }

    // Actualizar registros existentes e insertar nuevos
    for (const disease of diseases) {
      if (disease.id) {
        // Actualizar registro existente
        await service.updateRecord('user_diseases', disease.id, {
          ...disease,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_diseases', {
          ...disease,
          user_id
        });
      }
    }

    for (const disability of disabilities) {
      if (disability.id) {
        // Actualizar registro existente
        await service.updateRecord('user_disabilities', disability.id, {
          ...disability,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_disabilities', {
          ...disability,
          user_id
        });
      }
    }

    for (const distinctive of distinctives) {
      if (distinctive.id) {
        // Actualizar registro existente
        await service.updateRecord('user_distinctives', distinctive.id, {
          ...distinctive,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_distinctives', {
          ...distinctive,
          user_id
        });
      }
    }

    const updatedDiseases = await getByUserIdOrdered('user_diseases', user_id, 'diagnosed_date');
    const updatedDisabilities = await getByUserIdOrdered('user_disabilities', user_id, 'created_at');
    const updatedDistinctives = await getByUserIdOrdered('user_distinctives', user_id, 'created_at');

    return { 
      diseases: updatedDiseases,
      disabilities: updatedDisabilities,
      distinctives: updatedDistinctives
    };
  } catch (error) {
    console.error('Error en createHealthData:', error);
    throw error;
  }
};

/**
 * Crea o actualiza alergias y medicamentos de un usuario
 * @param {Object} data - Datos de alergias y medicamentos
 * @returns {Promise<Object>} - Alergias y medicamentos actualizados
 */
const createAllergiesAndMedications = async (data) => {
  try {
    const { allergies = [], medications = [], user_id } = data;

    if ((!Array.isArray(allergies) || allergies.length === 0) &&
        (!Array.isArray(medications) || medications.length === 0)) {
      throw new ValidationError('Debe haber al menos un registro de alergias o medicamentos');
    }

    // Verificar si el usuario existe
    const user = await userRepository.getUserById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Obtener registros actuales
    const existingAllergies = await getByUserId('user_allergies', user_id);
    const existingMedications = await getByUserId('user_medications', user_id);

    // Obtener IDs de nuevos registros
    const newAllergyIds = allergies.map(a => a.id).filter(id => id !== undefined);
    const newMedicationIds = medications.map(m => m.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteAllergies = existingAllergies.filter(a => !newAllergyIds.includes(a.id));
    for (const record of recordsToDeleteAllergies) {
      await service.removeRecord('user_allergies', record.id);
    }

    const recordsToDeleteMedications = existingMedications.filter(m => !newMedicationIds.includes(m.id));
    for (const record of recordsToDeleteMedications) {
      await service.removeRecord('user_medications', record.id);
    }

    // Actualizar registros existentes e insertar nuevos
    for (const allergy of allergies) {
      if (allergy.id) {
        // Actualizar registro existente
        await service.updateRecord('user_allergies', allergy.id, {
          ...allergy,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_allergies', {
          ...allergy,
          user_id
        });
      }
    }

    for (const medication of medications) {
      if (medication.id) {
        // Actualizar registro existente
        await service.updateRecord('user_medications', medication.id, {
          ...medication,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_medications', {
          ...medication,
          user_id
        });
      }
    }

    const updatedAllergies = await getByUserIdOrdered('user_allergies', user_id, 'created_at');
    const updatedMedications = await getByUserIdOrdered('user_medications', user_id, 'created_at');

    return { 
      allergies: updatedAllergies,
      medications: updatedMedications
    };
  } catch (error) {
    console.error('Error en createAllergiesAndMedications:', error);
    throw error;
  }
};

/**
 * Crea o actualiza las vacunas de un usuario
 * @param {Object} data - Datos de vacunas
 * @returns {Promise<Object>} - Vacunas actualizadas
 */
const createVaccinations = async (data) => {
  try {
    const { vaccinations = [], user_id } = data;

    if (!Array.isArray(vaccinations) || vaccinations.length === 0) {
      throw new ValidationError('El array de vacunaciones es requerido y no puede estar vacío');
    }

    // Verificar si el usuario existe
    const user = await userRepository.getUserById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Obtener registros actuales
    const existingVaccinations = await getByUserId('user_vaccinations', user_id);

    // Obtener IDs de nuevos registros
    const newVaccinationIds = vaccinations.map(v => v.id).filter(id => id !== undefined);

    // Identificar y eliminar registros obsoletos
    const recordsToDeleteVaccinations = existingVaccinations.filter(v => !newVaccinationIds.includes(v.id));
    for (const record of recordsToDeleteVaccinations) {
      await service.removeRecord('user_vaccinations', record.id);
    }

    // Actualizar registros existentes e insertar nuevos
    for (const vaccination of vaccinations) {
      if (vaccination.id) {
        // Actualizar registro existente
        await service.updateRecord('user_vaccinations', vaccination.id, {
          ...vaccination,
          user_id
        });
      } else {
        // Crear nuevo registro
        await service.createRecord('user_vaccinations', {
          ...vaccination,
          user_id
        });
      }
    }

    const updatedVaccinations = await getByUserIdOrdered('user_vaccinations', user_id, 'vaccination_date');

    return { 
      vaccinations: updatedVaccinations
    };
  } catch (error) {
    console.error('Error en createVaccinations:', error);
    throw error;
  }
};

/**
 * Obtiene registros por ID de usuario
 * @param {string} table - Nombre de la tabla
 * @param {number} user_id - ID del usuario
 * @returns {Promise<Array>} - Registros obtenidos
 */
const getByUserId = async (table, user_id) => {
  try {
    const query = `SELECT * FROM ${table} WHERE user_id = $1`;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener registros de ${table} para el usuario ${user_id}:`, error);
    return [];
  }
};

/**
 * Obtiene registros por ID de usuario ordenados por una columna
 * @param {string} table - Nombre de la tabla
 * @param {number} user_id - ID del usuario
 * @param {string} orderColumn - Columna por la que ordenar
 * @returns {Promise<Array>} - Registros ordenados
 */
const getByUserIdOrdered = async (table, user_id, orderColumn) => {
  try {
    const query = `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY ${orderColumn} ASC NULLS LAST`;
    const result = await pool.query(query, [user_id]);
    return formatDatesInData(result.rows);
  } catch (error) {
    console.error(`Error al obtener registros ordenados de ${table} para el usuario ${user_id}:`, error);
    return [];
  }
};

module.exports = {
  getUserHealthData,
  createMedicalFamilyHistory,
  createHealthData,
  createAllergiesAndMedications,
  createVaccinations,
  getByUserId,
  getByUserIdOrdered
};
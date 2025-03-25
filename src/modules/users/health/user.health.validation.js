const Joi = require('joi');

// User Medical History Schema
const userMedicalHistorySchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID del historial debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  history_type: Joi.string().max(50).required().messages({
    'string.max': 'El tipo de historial no puede tener más de 50 caracteres',
    'any.required': 'El tipo de historial es obligatorio',
    'string.empty': 'El tipo de historial no puede estar vacío',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La descripción no puede tener más de 1000 caracteres',
  }),
  history_date: Joi.date().optional().messages({
    'date.base': 'La fecha de historial debe ser una fecha válida',
  }),
});

// User Family History Schema
const userFamilyHistorySchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID del historial debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  history_type: Joi.string().max(50).required().messages({
    'string.max': 'El tipo de historial no puede tener más de 50 caracteres',
    'any.required': 'El tipo de historial es obligatorio',
    'string.empty': 'El tipo de historial no puede estar vacío',
  }),
  relationship: Joi.string().max(100).required().messages({
    'string.max': 'La relación no puede tener más de 100 caracteres',
    'any.required': 'La relación es obligatoria',
    'string.empty': 'La relación no puede estar vacía',
  }),
  history_date: Joi.date().optional().messages({
    'date.base': 'La fecha de historial debe ser una fecha válida',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La descripción no puede tener más de 1000 caracteres',
  }),
});

// User Disease Schema
const userDiseaseSchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID de la enfermedad debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  disease: Joi.string().max(200).required().messages({
    'string.max': 'El nombre de la enfermedad no puede tener más de 200 caracteres',
    'any.required': 'El nombre de la enfermedad es obligatorio',
    'string.empty': 'El nombre de la enfermedad no puede estar vacío',
  }),
  diagnosed_date: Joi.date().optional().messages({
    'date.base': 'La fecha de diagnóstico debe ser una fecha válida',
  }),
  treatment_required: Joi.boolean().strict().messages({
    'boolean.base': 'El campo de tratamiento requerido debe ser verdadero o falso',
  })
});

// User Disability Schema
const userDisabilitySchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID de la discapacidad debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  name: Joi.string().max(50).required().messages({
    'string.max': 'El nombre de la discapacidad no puede tener más de 50 caracteres',
    'any.required': 'El nombre de la discapacidad es obligatorio',
    'string.empty': 'El nombre de la discapacidad no puede estar vacío',
  }),
});

// User Distinctive Schema
const userDistinctiveSchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID del distintivo debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  description: Joi.string().max(1000).required().messages({
    'string.max': 'La descripción no puede tener más de 1000 caracteres',
    'any.required': 'La descripción es obligatoria',
    'string.empty': 'La descripción no puede estar vacía',
  }),
});

// User Allergy Schema
const userAllergySchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID de la alergia debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  allergy_type: Joi.string().max(100).required().messages({
    'string.max': 'El tipo de alergia no puede tener más de 100 caracteres',
    'any.required': 'El tipo de alergia es obligatorio',
    'string.empty': 'El tipo de alergia no puede estar vacío',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La descripción no puede tener más de 1000 caracteres',
  }),
  severity: Joi.string()
    .valid('MILD', 'MODERATE', 'SEVERE')
    .default('MILD')
    .messages({
      'any.only': 'La severidad debe ser Leve, Moderada o Severa',
    }),
});

// User Medication Schema
const userMedicationSchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID del medicamento debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  medication: Joi.string().max(100).required().messages({
    'string.max': 'El nombre del medicamento no puede tener más de 100 caracteres',
    'any.required': 'El nombre del medicamento es obligatorio',
    'string.empty': 'El nombre del medicamento no puede estar vacío',
  }),
  laboratory: Joi.string().max(100).optional().messages({
    'string.max': 'El laboratorio no puede tener más de 100 caracteres',
  }),
  prescription: Joi.string().max(255).optional().messages({
    'string.max': 'La prescripción no puede tener más de 255 caracteres',
  }),
  dosage: Joi.string().max(100).optional().messages({
    'string.max': 'La dosis no puede tener más de 100 caracteres',
  }),
  frequency: Joi.string().max(50).optional().messages({
    'string.max': 'La frecuencia no puede tener más de 50 caracteres',
  }),
});

// User Vaccination Schema
const userVaccinationSchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID de la vacuna debe ser un número',
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  vaccine: Joi.string().max(100).required().messages({
    'string.max': 'El nombre de la vacuna no puede tener más de 100 caracteres',
    'any.required': 'El nombre de la vacuna es obligatorio',
    'string.empty': 'El nombre de la vacuna no puede estar vacío',
  }),
  vaccination_date: Joi.date().required().messages({
    'date.base': 'La fecha de vacunación debe ser una fecha válida',
    'any.required': 'La fecha de vacunación es obligatoria',
  }),
});

// User vaccinations array schema
const userVaccinationsSchema = Joi.object({
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  vaccinations: Joi.array().items(userVaccinationSchema).min(1).required().messages({
    'array.min': 'Debe haber al menos un registro de vacunación',
    'any.required': 'El campo vaccinations es obligatorio',
  }),
});

// Combined schemas for bulk operations
const userMedicalAndFamilyHistorySchema = Joi.object({
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  medicalHistory: Joi.array().items(userMedicalHistorySchema).optional(),
  familyHistory: Joi.array().items(userFamilyHistorySchema).optional(),
}).or('medicalHistory', 'familyHistory')
.messages({
  'object.missing': 'Debe proporcionar al menos historial médico o familiar',
});

const userHealthDataSchema = Joi.object({
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  diseases: Joi.array().items(userDiseaseSchema).optional(),
  disabilities: Joi.array().items(userDisabilitySchema).optional(),
  distinctives: Joi.array().items(userDistinctiveSchema).optional(),
}).or('diseases', 'disabilities', 'distinctives')
.messages({
  'object.missing': 'Debe proporcionar al menos enfermedades, discapacidades o distintivos',
});

const userAllergiesAndMedicationsSchema = Joi.object({
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  allergies: Joi.array().items(userAllergySchema).optional(),
  medications: Joi.array().items(userMedicationSchema).optional(),
}).or('allergies', 'medications')
.messages({
  'object.missing': 'Debe proporcionar al menos alergias o medicamentos',
});

module.exports = {
  userMedicalHistorySchema,
  userFamilyHistorySchema,
  userDiseaseSchema,
  userDisabilitySchema,
  userDistinctiveSchema,
  userAllergySchema,
  userMedicationSchema,
  userVaccinationSchema,
  userVaccinationsSchema,
  userMedicalAndFamilyHistorySchema,
  userHealthDataSchema,
  userAllergiesAndMedicationsSchema
};
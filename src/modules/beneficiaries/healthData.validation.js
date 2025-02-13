const Joi = require('joi');
const { beneficiaryMedicalHistorySchema } = require('./medical_history/medical_history.validation');
const { beneficiaryFamilyHistorySchema } = require('./family_history/family_history.validation');
const { beneficiaryDiseaseSchema } = require('./diseases/diseases.validation');
const { beneficiaryDisabilitySchema } = require('./disabilities/disabilities.validation');
const { beneficiaryDistinctiveSchema } = require('./distintives/distintives.validation');

const { beneficiaryAllergySchema } = require('./allergies/allergies.validation');
const { beneficiaryMedicationSchema } = require('./medications/medications.validation');


const medicalAndFamilyHistorySchema = Joi.object({
  medicalHistory: Joi.array().items(beneficiaryMedicalHistorySchema).optional(),
  familyHistory: Joi.array().items(beneficiaryFamilyHistorySchema).optional(),
}).or('medicalHistory', 'familyHistory') 
.messages({
  'object.missing': 'Debe proporcionar al menos historial médico o familiar',
});

const healthDataSchema = Joi.object({
  diseases: Joi.array().items(beneficiaryDiseaseSchema).optional(),
  disabilities: Joi.array().items(beneficiaryDisabilitySchema).optional(),
  distinctives: Joi.array().items(beneficiaryDistinctiveSchema).optional(),
}).or('diseases', 'disabilities', 'distinctives') 
.messages({
  'object.missing': 'Debe proporcionar al menos enfermedades, discapacidades o distintivos',
});



const allergiesAndMedicationsSchema = Joi.object({
  allergies: Joi.array().items(beneficiaryAllergySchema).optional(),
  medications: Joi.array().items(beneficiaryMedicationSchema).optional(),
}).or('allergies', 'medications')
.messages({
  'object.missing': 'Debe proporcionar al menos alergias o medicamentos',
});


module.exports = { medicalAndFamilyHistorySchema, healthDataSchema, allergiesAndMedicationsSchema };

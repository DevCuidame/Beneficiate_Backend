const Joi = require('joi');

const beneficiaryMedicationSchema = Joi.object({
  id: Joi.number().optional().allow(null, '').messages({
    'number.base': 'El ID de la vacuna debe ser un número',
    'any.required': 'El ID de la vacuna o es obligatorio',
  }),
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
  }),
  medication: Joi.string().max(100).required().messages({
    'string.max':
      'El nombre del medicamento no puede tener más de 100 caracteres',
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

module.exports = { beneficiaryMedicationSchema };

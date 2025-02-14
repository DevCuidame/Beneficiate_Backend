const Joi = require('joi');

const beneficiaryFamilyHistorySchema = Joi.object({
    id: Joi.number().optional().allow(null, '').messages({
          'number.base': 'El ID de la vacuna debe ser un número',
          'any.required': 'El ID de la vacuna o es obligatorio',
        }),
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
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

module.exports = { beneficiaryFamilyHistorySchema };
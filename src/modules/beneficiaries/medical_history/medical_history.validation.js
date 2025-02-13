const Joi = require('joi');

const beneficiaryMedicalHistorySchema = Joi.object({
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
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

module.exports = { beneficiaryMedicalHistorySchema };
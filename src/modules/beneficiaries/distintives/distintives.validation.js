const Joi = require('joi');

const beneficiaryDistinctiveSchema = Joi.object({
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
  }),
  description: Joi.string().max(1000).required().messages({
    'string.max': 'La descripción no puede tener más de 1000 caracteres',
    'any.required': 'La descripción es obligatoria',
    'string.empty': 'La descripción no puede estar vacía',
  }),
});

module.exports = { beneficiaryDistinctiveSchema };
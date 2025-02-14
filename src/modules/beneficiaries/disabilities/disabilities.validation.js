
const Joi = require('joi');

const beneficiaryDisabilitySchema = Joi.object({
    id: Joi.number().optional().allow(null, '').messages({
          'number.base': 'El ID de la vacuna debe ser un número',
          'any.required': 'El ID de la vacuna o es obligatorio',
        }),
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
  }),
  name: Joi.string().max(50).required().messages({
    'string.max': 'El nombre de la discapacidad no puede tener más de 50 caracteres',
    'any.required': 'El nombre de la discapacidad es obligatorio',
    'string.empty': 'El nombre de la discapacidad no puede estar vacío',
  }),
});

module.exports = { beneficiaryDisabilitySchema };

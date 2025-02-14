const Joi = require('joi');

const beneficiaryAllergySchema = Joi.object({
    id: Joi.number().optional().allow(null, '').messages({
          'number.base': 'El ID de la vacuna debe ser un número',
          'any.required': 'El ID de la vacuna o es obligatorio',
        }),
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
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

module.exports = { beneficiaryAllergySchema };

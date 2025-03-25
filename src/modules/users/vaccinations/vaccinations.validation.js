const Joi = require('joi');

const beneficiaryVaccinationSchema = Joi.object({
  vaccinations: Joi.array().items(
    Joi.object({
      id: Joi.number().optional().allow(null, '').messages({
        'number.base': 'El ID de la vacuna debe ser un número',
        'any.required': 'El ID de la vacuna o es obligatorio',
      }),
      user_id: Joi.number().required().messages({
        'number.base': 'El ID del beneficiario debe ser un número',
        'any.required': 'El ID del beneficiario es obligatorio',
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
    })
  ).min(1).required().messages({
    'array.min': 'Debe haber al menos un registro de vacunación',
    'any.required': 'El campo vaccinations es obligatorio',
  }),
});

module.exports = { beneficiaryVaccinationSchema };

const Joi = require('joi');

const beneficiaryDiseaseSchema = Joi.object({
    id: Joi.number().optional().allow(null, '').messages({
          'number.base': 'El ID de la vacuna debe ser un número',
          'any.required': 'El ID de la vacuna o es obligatorio',
        }),
  beneficiary_id: Joi.number().required().messages({
    'number.base': 'El ID del beneficiario debe ser un número',
    'any.required': 'El ID del beneficiario es obligatorio',
  }),
  disease: Joi.string().max(200).required().messages({
    'string.max': 'El nombre de la enfermedad no puede tener más de 200 caracteres',
    'any.required': 'El nombre de la enfermedad es obligatorio',
    'string.empty': 'El nombre de la enfermedad no puede estar vacío',
  }),
  diagnosed_date: Joi.date().optional().messages({
    'date.base': 'La fecha de diagnóstico debe ser una fecha válida',
  }),
  treatment_required: Joi.boolean().default(false).messages({
    'boolean.base': 'El campo de tratamiento requerido debe ser verdadero o falso',
  }),
});

module.exports = { beneficiaryDiseaseSchema };

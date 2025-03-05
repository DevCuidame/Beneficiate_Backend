const Joi = require('joi');

const appointmentSchema = Joi.object({
  id: Joi.number().optional().allow('', null).messages({
    'number.base': 'El ID de la cita debe ser un número',
  }),
  user_id: Joi.number().optional().allow('', null).messages({
    'number.base': 'El ID del usuario es requerido',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  beneficiary_id: Joi.number().optional().allow(null).messages({
    'number.base': 'El ID del beneficiario debe ser un número',
  }),

  specialty_id: Joi.string().optional().allow(null).messages({
    'number.base': 'El ID de la especialidad debe ser un número',
  }),
  appointment_date: Joi.date()
    .greater('now')
    .optional()
    .allow('', null)
    .messages({
      'date.base': 'La fecha de la cita debe ser una fecha válida',
      'any.required': 'La fecha de la cita es obligatoria',
      'date.greater': 'La fecha de la cita debe ser en el futuro',
    }),

    appointment_time: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'date.base': 'La hora de la cita debe ser una fecha válida',
      'any.required': 'La hora de la cita es obligatoria',
    }),

  created_at: Joi.date().optional().allow('', null).messages({
    'date.base': 'La fecha de creación debe ser una fecha válida',
  }),

  created_at_formatted: Joi.string().optional().allow('', null).messages({
  }),
  professional_id: Joi.string()
    .optional()
    .allow('', null)
    .messages({}),

  duration_minutes: Joi.number()
    .optional()
    .allow('', null)
    .messages({}),
    

  userData: Joi.any().optional().allow('', null).messages({}),
  professionalData: Joi.any().optional().allow('', null).messages({}),
  specialtyData: Joi.any().optional().allow('', null).messages({}),

  control: Joi.boolean().optional().allow('', null).messages({}),

  first_time: Joi.boolean().optional().allow('', null).messages({}),

  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'TO_BE_CONFIRMED')
    .optional()
    .allow('', null)
    .messages({
      'any.only':
        'El estado debe ser PENDING, CONFIRMED, CANCELLED o RESCHEDULED',
      'any.required': 'El estado de la cita es obligatorio',
    }),
  notes: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Las notas no pueden tener más de 500 caracteres',
  }),

  is_for_beneficiary: Joi.boolean().optional().allow('', null).messages({
    'any.required': 'Is for beneficiary es requerido',
  }),
});

module.exports = { appointmentSchema };

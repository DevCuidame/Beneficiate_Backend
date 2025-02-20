const Joi = require('joi');

const medicalProfessionalSchema = Joi.object({
  id: Joi.number().optional().allow('', null).messages({
    'number.base': 'El ID del profesional debe ser un número',
  }),

  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),

  nationality: Joi.string().max(100).optional().allow('', null).messages({
    'string.max': 'La nacionalidad no puede tener más de 100 caracteres',
  }),

  profession: Joi.string().min(3).max(255).required().messages({
    'string.min': 'La profesión debe tener al menos 3 caracteres',
    'string.max': 'La profesión no puede tener más de 255 caracteres',
    'any.required': 'La profesión es obligatoria',
    'string.empty': 'La profesión no puede estar vacía',
  }),

  specialty: Joi.string().min(3).max(255).required().messages({
    'string.min': 'La especialidad debe tener al menos 3 caracteres',
    'string.max': 'La especialidad no puede tener más de 255 caracteres',
    'any.required': 'La especialidad es obligatoria',
    'string.empty': 'La especialidad no puede estar vacía',
  }),

  medical_registration: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'El registro médico no puede tener más de 255 caracteres',
  }),

  professional_card_number: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'El número de tarjeta profesional no puede tener más de 255 caracteres',
  }),

  university: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'El nombre de la universidad no puede tener más de 255 caracteres',
  }),

  graduation_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().messages({
    'number.base': 'El año de graduación debe ser un número',
    'number.min': 'El año de graduación debe ser mayor o igual a 1900',
    'number.max': 'El año de graduación no puede ser mayor al año actual',
  }),

  additional_certifications: Joi.string().optional().allow('', null),

  years_experience: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Los años de experiencia deben ser un número',
    'number.min': 'Los años de experiencia no pueden ser negativos',
  }),

  consultation_address: Joi.string().max(255).required().messages({
    'string.max': 'La dirección del consultorio no puede tener más de 255 caracteres',
    'any.required': 'La dirección del consultorio es obligatoria',
    'string.empty': 'La dirección del consultorio no puede estar vacía',
  }),

  institution_name: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'El nombre de la institución no puede tener más de 255 caracteres',
  }),

  attention_township_id: Joi.number().optional().messages({
    'number.base': 'El ID del municipio de atención debe ser un número',
  }),

  consultation_schedule: Joi.string().optional().allow('', null),

  consultation_modes: Joi.array().items(
    Joi.string().valid('PRESENCIAL', 'VIRTUAL', 'DOMICILIARIA')
  ).min(1).required().messages({
    'array.min': 'Debe seleccionar al menos una modalidad de atención',
    'any.required': 'Las modalidades de atención son obligatorias',
  }),

  weekly_availability: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'La disponibilidad semanal no puede tener más de 255 caracteres',
  }),

  created_at: Joi.date().optional().messages({
    'date.base': 'La fecha de creación debe ser una fecha válida',
  }),
});

module.exports = { medicalProfessionalSchema };

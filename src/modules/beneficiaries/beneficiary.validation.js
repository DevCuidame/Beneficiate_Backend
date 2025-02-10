const Joi = require('joi');

const beneficiarySchema = Joi.object({
  user_id: Joi.number().optional().messages({
    'number.base': 'El ID del usuario es requerido',
  }),
  first_name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede tener más de 100 caracteres',
    'any.required': 'El nombre es obligatorio',
    'string.empty': 'El nombre no puede estar vacío',
  }),
  last_name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'El apellido debe tener al menos 3 caracteres',
    'string.max': 'El apellido no puede tener más de 100 caracteres',
    'any.required': 'El apellido es obligatorio',
    'string.empty': 'El apellido no puede estar vacío',
  }),
  identification_type: Joi.string()
    .valid('CC', 'TI', 'CE', 'PASSPORT', 'OTHER')
    .required()
    .messages({
      'any.only':
        'El tipo de identificación debe ser CC, TI, CE, PASSPORT o OTHER',
      'any.required': 'El tipo de identificación es obligatorio',
      'string.empty': 'El tipo de identificación no puede estar vacío',
    }),
  identification_number: Joi.string().max(80).required().messages({
    'string.max':
      'El número de identificación no puede tener más de 80 caracteres',
    'any.required': 'El número de identificación es obligatorio',
    'string.empty': 'El número de identificación no puede estar vacío',
  }),
  phone: Joi.string().min(10).max(30).required().messages({
    'string.min': 'El teléfono debe tener al menos 10 caracteres',
    'string.max': 'El teléfono no puede tener más de 30 caracteres',
    'any.required': 'El teléfono es obligatorio',
    'string.empty': 'El teléfono no puede estar vacío',
  }),
  birth_date: Joi.date().optional().messages({
    'date.base': 'La fecha de nacimiento debe ser una fecha válida',
  }),
  gender: Joi.string().valid('M', 'F', 'Other').required().messages({
    'any.only': 'El género debe ser Male, Female o Other',
    'any.required': 'El género es obligatorio',
    'string.empty': 'El género no puede estar vacío',
  }),
  city_id: Joi.number().optional().messages({
    'number.base': 'El ID de la ciudad debe ser un número',
  }),
  address: Joi.string().max(255).required().messages({
    'string.max': 'La dirección no puede tener más de 255 caracteres',
    'any.required': 'La dirección es obligatoria',
    'string.empty': 'La dirección no puede estar vacía',
  }),
  blood_type: Joi.string().max(35).required().messages({
    'string.max': 'El tipo de sangre no puede tener más de 35 caracteres',
    'any.required': 'El tipo de sangre es obligatorio',
    'string.empty': 'El tipo de sangre no puede estar vacío',
  }),
  health_provider: Joi.string().max(50).optional().allow('').messages({
    'string.max': 'El proveedor de salud no puede tener más de 50 caracteres',
  }),
  prepaid_health: Joi.string().max(50).optional().allow('').messages({
    'string.max':
      'El seguro de salud prepagado no puede tener más de 50 caracteres',
  }),
  work_risk_insurance: Joi.string().max(50).optional().allow('').messages({
    'string.max':
      'El seguro de riesgos laborales no puede tener más de 50 caracteres',
  }),
  funeral_insurance: Joi.string().max(50).optional().allow('').messages({
    'string.max': 'El seguro funerario no puede tener más de 50 caracteres',
  }),
  removed: Joi.boolean().default(false),
  public_name: Joi.string().max(100).optional().messages({
    'string.max': 'No has cargado una imagen',
  }),
  private_name: Joi.string().max(100).optional().messages({
  }),
  base_64: Joi.string().optional().messages({
    'string.base': 'No has cargado una imagen',
  }),
});

module.exports = { beneficiarySchema };

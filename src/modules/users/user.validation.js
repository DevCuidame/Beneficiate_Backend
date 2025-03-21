const Joi = require('joi');

/**
 * Schema de validación para actualización de usuario
 */
const userUpdateSchema = Joi.object({
    first_name: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres',
      'string.empty': 'El nombre no puede estar vacío'
    }),
    last_name: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'El apellido debe tener al menos 3 caracteres',
      'string.max': 'El apellido no puede tener más de 100 caracteres',
      'string.empty': 'El apellido no puede estar vacío'
    }),
    identification_type: Joi.string().valid('CC', 'TI', 'CE', 'PASSPORT', 'OTHER').optional().messages({
      'any.only': 'El tipo de identificación debe ser CC, TI, CE, PASSPORT o OTHER',
      'string.empty': 'El tipo de identificación no puede estar vacío'
    }),
    identification_number: Joi.string().max(80).optional().messages({
      'string.max': 'El número de identificación no puede tener más de 80 caracteres',
      'string.empty': 'El número de identificación no puede estar vacío'
    }),
    phone: Joi.string().min(10).max(30).optional().messages({
      'string.min': 'El teléfono debe tener al menos 10 caracteres',
      'string.max': 'El teléfono no puede tener más de 30 caracteres',
      'string.empty': 'El teléfono no puede estar vacío'
    }),
    address: Joi.string().max(255).optional().messages({
      'string.max': 'La dirección no puede tener más de 255 caracteres',
      'string.empty': 'La dirección no puede estar vacía'
    }),
    city_id: Joi.number().optional().messages({
      'number.base': 'El ID de la ciudad debe ser un número'
    }),
    gender: Joi.string().valid('M', 'F', 'Other').optional().messages({
      'any.only': 'El género debe ser M, F u Other',
      'string.empty': 'El género no puede estar vacío'
    }),
    birth_date: Joi.date().optional().messages({
      'date.base': 'La fecha de nacimiento debe ser una fecha válida'
    }),
    public_name: Joi.string().max(100).optional().messages({
      'string.max': 'El nombre público no puede tener más de 100 caracteres'
    }),
    base_64: Joi.string().optional().messages({
      'string.base': 'La imagen debe ser una cadena en formato Base64'
    })
  });
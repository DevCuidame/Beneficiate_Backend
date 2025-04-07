const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "El correo debe ser válido",
    "any.required": "El correo es obligatorio",
    "string.empty": "El correo no puede estar vacío"
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "La contraseña debe tener al menos 6 caracteres",
    "any.required": "La contraseña es obligatoria",
    "string.empty": "La contraseña no puede estar vacía"
  })
});


const registerSchema = Joi.object({
  first_name: Joi.string().min(3).max(100).required().messages({
    "string.min": "El nombre debe tener al menos 3 caracteres",
    "string.max": "El nombre no puede tener más de 100 caracteres",
    "any.required": "El nombre es obligatorio",
    "string.empty": "El nombre no puede estar vacío"
  }),
  last_name: Joi.string().min(3).max(100).required().messages({
    "string.min": "El apellido debe tener al menos 3 caracteres",
    "string.max": "El apellido no puede tener más de 100 caracteres",
    "any.required": "El apellido es obligatorio",
    "string.empty": "El apellido no puede estar vacío"
  }),
  identification_type: Joi.string().valid('CC', 'TI', 'CE', 'PASSPORT', 'OTHER').required().messages({
    "any.only": "El tipo de identificación debe ser CC, TI, CE, PASSPORT o OTHER",
    "any.required": "El tipo de identificación es obligatorio",
    "string.empty": "El tipo de identificación no puede estar vacío"
  }),
  
  identification_number: Joi.string().max(80).required().messages({
    "string.max": "El número de identificación no puede tener más de 80 caracteres",
    "any.required": "El número de identificación es obligatorio",
    "string.empty": "El número de identificación no puede estar vacío"
  }),
  
  address: Joi.string().max(100).optional().messages({
    "string.max": "La dirección no puede tener más de 100 caracteres"
  }),
  city_id: Joi.number().optional().messages({
    "number.base": "El ID de la ciudad debe ser un número",
    "string.empty": "La ciudad es obligatoria"
  }),
  department: Joi.number().optional().allow().messages({
    "number.base": "El ID del departamento debe ser un número",
    "string.empty": "El departamento es obligatoria"
  }),
  phone: Joi.string().min(10).max(10).required().messages({
    "string.min": "El teléfono debe tener al menos 10 caracteres",
    "string.max": "El teléfono no puede tener más de 10 caracteres",
    "any.required": "El teléfono es obligatorio",
    "string.empty": "El teléfono no puede estar vacío"
  }),
  birth_date: Joi.date().optional().messages({
    'date.base': 'La fecha de nacimiento debe ser una fecha válida',
  }),
  gender: Joi.string().valid('M', 'F', 'Other').required().messages({
    'any.only': 'El género debe ser Male, Female o Other',
    'any.required': 'El género es obligatorio',
    'string.empty': 'El género no puede estar vacío',
  }),
  email: Joi.string().email().required().messages({
    "string.email": "El correo debe ser válido",
    "any.required": "El correo es obligatorio",
    "string.empty": "El correo no puede estar vacío"
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "La contraseña debe tener al menos 8 caracteres",
    "any.required": "La contraseña es obligatoria",
    "string.empty": "La contraseña no puede estar vacía"
  }),
  verified: Joi.boolean().default(false),
  plan_id: Joi.number().default(1),
  public_name: Joi.string().max(100).optional().messages({
    "string.max": "El nombre público no puede tener más de 100 caracteres"
  }),
  base_64: Joi.string().optional().messages({
    "string.base": "La imagen debe ser una cadena en formato Base64"
  }),
  privacy_policy: Joi.boolean().required().messages({
    "boolean.base": "Por favor, acepta los términos y condiciones"
  })
});

const deleteAccountSchema = Joi.object({
  password: Joi.string().required().messages({
    "any.required": "La contraseña es obligatoria",
    "string.empty": "La contraseña no puede estar vacía"
  })
});


module.exports = { loginSchema, registerSchema, deleteAccountSchema };

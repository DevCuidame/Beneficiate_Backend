const Joi = require('joi');

const imageSchema = Joi.object({
  user_id: Joi.number().required().messages({
    "number.base": "El ID del usuario debe ser un número",
    "any.required": "El ID del usuario es obligatorio"
  }),
  public_name: Joi.string().max(100).optional().messages({
    "string.max": "El nombre público no puede tener más de 100 caracteres"
  }),
  private_name: Joi.string().max(100).optional().messages({
    "string.max": "El nombre privado no puede tener más de 100 caracteres"
  }),
  image_path: Joi.string().uri().required().messages({
    "string.uri": "La ruta de la imagen debe ser una URL válida",
    "any.required": "La ruta de la imagen es obligatoria"
  })
});

module.exports = { imageSchema };

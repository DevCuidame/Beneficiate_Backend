// validations/chat.validation.js
const Joi = require('joi');

const chatSchema = Joi.object({
    sender_id: Joi.number().required().messages({
        'number.base': 'El ID del remitente debe ser un número',
        'any.required': 'El ID del remitente es obligatorio'
    }),
    receiver_id: Joi.number().required().messages({
        'number.base': 'El ID del receptor debe ser un número',
        'any.required': 'El ID del receptor es obligatorio'
    })
});

const messageSchema = Joi.object({
    chat_id: Joi.number().required().messages({
        'number.base': 'El ID del chat debe ser un número',
        'any.required': 'El ID del chat es obligatorio'
    }),
    sender_id: Joi.number().required().messages({
        'number.base': 'El ID del remitente debe ser un número',
        'any.required': 'El ID del remitente es obligatorio'
    }),
    sender_type: Joi.string().valid('USER', 'AGENT').required().messages({
        'any.only': 'El tipo de remitente debe ser USER o AGENT',
        'any.required': 'El tipo de remitente es obligatorio'
    }),
    message: Joi.string().max(500).required().messages({
        'string.max': 'El mensaje no puede tener más de 500 caracteres',
        'any.required': 'El mensaje es obligatorio',
        'string.empty': 'El mensaje no puede estar vacío'
    })
});

module.exports = { chatSchema, messageSchema };

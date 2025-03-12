// src/modules/agent_chat/agent_chat.validation.js
const Joi = require('joi');

// Esquema para iniciar un chat
const initiateChatSchema = Joi.object({
  agent_id: Joi.number().required().messages({
    'number.base': 'El ID del agente debe ser un número',
    'any.required': 'El ID del agente es obligatorio'
  }),
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio'
  })
});

// Esquema para enviar un mensaje
const sendMessageSchema = Joi.object({
  chat_id: Joi.number().required().messages({
    'number.base': 'El ID del chat debe ser un número',
    'any.required': 'El ID del chat es obligatorio'
  }),
  sender_id: Joi.number().required().messages({
    'number.base': 'El ID del remitente debe ser un número',
    'any.required': 'El ID del remitente es obligatorio'
  }),
  sender_type: Joi.string().valid('USER', 'AGENT', 'SYSTEM').required().messages({
    'any.only': 'El tipo de remitente debe ser USER, AGENT o SYSTEM',
    'any.required': 'El tipo de remitente es obligatorio'
  }),
  message: Joi.string().max(1000).required().messages({
    'string.max': 'El mensaje no puede tener más de 1000 caracteres',
    'any.required': 'El mensaje es obligatorio',
    'string.empty': 'El mensaje no puede estar vacío'
  })
});

// Esquema para cerrar un chat
const closeChatSchema = Joi.object({
  chat_id: Joi.number().required().messages({
    'number.base': 'El ID del chat debe ser un número',
    'any.required': 'El ID del chat es obligatorio'
  }),
  closed_by: Joi.number().required().messages({
    'number.base': 'El ID de quien cierra el chat debe ser un número',
    'any.required': 'Se debe especificar quién cierra el chat'
  })
});

module.exports = {
  initiateChatSchema,
  sendMessageSchema,
  closeChatSchema
};
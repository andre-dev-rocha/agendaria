// src/schemas/authSchemas.js

const registerUserSchema = {
  type: 'object',
  required: ['name', 'email', 'password', 'role'],
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 255 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 }, // Senha mínima de 8 caracteres
    role: { type: 'string', enum: ['admin', 'employee', 'client'] },
    phone: { type: 'string', maxLength: 20, nullable: true }
  },
  additionalProperties: false // Impede propriedades não definidas
};

const loginUserSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  },
  additionalProperties: false
};

// Esquema para a resposta (opcional, mas boa prática para documentação)
const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'employee', 'client'] },
    phone: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const authSuccessResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    user: userResponseSchema,
    token: { type: 'string' }
  },
  required: ['message', 'user', 'token']
};

const authRegisterSuccessResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    user: userResponseSchema
  },
  required: ['message', 'user']
};


module.exports = {
  registerUserSchema,
  loginUserSchema,
  authSuccessResponseSchema,
  authRegisterSuccessResponseSchema
};
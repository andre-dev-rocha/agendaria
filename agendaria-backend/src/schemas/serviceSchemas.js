// src/schemas/serviceSchemas.js

const createServiceSchema = {
  type: 'object',
  required: ['name', 'duration', 'price'],
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 255 },
    description: { type: 'string', maxLength: 1000, nullable: true },
    duration: { type: 'integer', minimum: 1, description: 'Duration in minutes' },
    price: { type: 'number', minimum: 0, description: 'Price of the service' }
  },
  additionalProperties: false
};

const updateServiceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 255 },
    description: { type: 'string', maxLength: 1000, nullable: true },
    duration: { type: 'integer', minimum: 1 },
    price: { type: 'number', minimum: 0 }
  },
  minProperties: 1, // Pelo menos uma propriedade deve ser fornecida para atualização
  additionalProperties: false
};

const serviceResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    company_id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    duration: { type: 'integer' },
    price: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'company_id', 'name', 'duration', 'price', 'createdAt', 'updatedAt']
};

const serviceListResponseSchema = {
  type: 'array',
  items: serviceResponseSchema
};

const serviceParamsSchema = {
  type: 'object',
  properties: {
    serviceId: { type: 'string', format: 'uuid' }
  },
  required: ['serviceId']
};

// Esquema para parâmetros de rota que incluem companyId e serviceId (para rotas aninhadas)
const companyServiceParamsSchema = {
  type: 'object',
  properties: {
    companyId: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' }
  },
  required: ['companyId', 'serviceId']
};

const companyIdParamSchema = {
  type: 'object',
  properties: {
    companyId: { type: 'string', format: 'uuid' }
  },
  required: ['companyId']
};

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  serviceResponseSchema,
  serviceListResponseSchema,
  serviceParamsSchema,
  companyServiceParamsSchema,
  companyIdParamSchema
};
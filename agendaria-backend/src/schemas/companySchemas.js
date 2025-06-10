// src/schemas/companySchemas.js

const createCompanySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 255 },
    description: { type: 'string', maxLength: 1000, nullable: true },
    address: { type: 'string', maxLength: 255, nullable: true },
    phone: { type: 'string', maxLength: 20, nullable: true },
    email: { type: 'string', format: 'email', nullable: true }
  },
  additionalProperties: false
};

const updateCompanySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 255 },
    description: { type: 'string', maxLength: 1000, nullable: true },
    address: { type: 'string', maxLength: 255, nullable: true },
    phone: { type: 'string', maxLength: 20, nullable: true },
    email: { type: 'string', format: 'email', nullable: true }
  },
  minProperties: 1, // Pelo menos uma propriedade deve ser fornecida para atualização
  additionalProperties: false
};

const companyResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    owner_id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    email: { type: 'string', format: 'email', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'owner_id', 'name', 'createdAt', 'updatedAt']
};

const companyListResponseSchema = {
  type: 'array',
  items: companyResponseSchema
};

const companyParamsSchema = {
  type: 'object',
  properties: {
    companyId: { type: 'string', format: 'uuid' }
  },
  required: ['companyId']
};


module.exports = {
  createCompanySchema,
  updateCompanySchema,
  companyResponseSchema,
  companyListResponseSchema,
  companyParamsSchema
};
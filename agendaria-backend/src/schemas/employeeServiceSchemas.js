// src/schemas/employeeServiceSchemas.js

// Schema para associar um serviço a um funcionário
const addEmployeeServiceSchema = {
  type: 'object',
  required: ['serviceId'],
  properties: {
    serviceId: { type: 'string', format: 'uuid', description: 'ID of the service to associate.' }
  },
  additionalProperties: false
};

// Schema para a resposta de um EmployeeService
const employeeServiceResponseSchema = {
  type: 'object',
  properties: {
    employee_id: { type: 'string', format: 'uuid' },
    service_id: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    employee: { // Inclui detalhes do funcionário (User)
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'employee', 'client'] },
        phone: { type: 'string', nullable: true }
      }
    },
    service: { // Inclui detalhes do serviço
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        company_id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        duration: { type: 'integer' },
        price: { type: 'number' }
      }
    }
  },
  required: ['employee_id', 'service_id', 'createdAt', 'updatedAt']
};

const employeeServicesListResponseSchema = {
  type: 'array',
  items: employeeServiceResponseSchema
};

// Schemas para parâmetros de rota
const employeeIdParamSchema = {
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' }
  },
  required: ['employeeId']
};

const serviceIdParamSchema = { // Já definido em serviceSchemas, mas para clareza aqui
  type: 'object',
  properties: {
    serviceId: { type: 'string', format: 'uuid' }
  },
  required: ['serviceId']
};

const employeeAndServiceParamsSchema = {
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' }
  },
  required: ['employeeId', 'serviceId']
};


module.exports = {
  addEmployeeServiceSchema,
  employeeServiceResponseSchema,
  employeeServicesListResponseSchema,
  employeeIdParamSchema,
  serviceIdParamSchema,
  employeeAndServiceParamsSchema
};
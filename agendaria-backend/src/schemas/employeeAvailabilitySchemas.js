// src/schemas/employeeAvailabilitySchemas.js

// Schema para criar ou atualizar a disponibilidade
const createUpdateEmployeeAvailabilitySchema = {
  type: 'object',
  required: ['day_of_week', 'start_time', 'end_time'],
  properties: {
    day_of_week: {
      type: 'integer',
      minimum: 0, // Domingo
      maximum: 6, // Sábado
      description: 'Day of the week (0=Sunday, 6=Saturday)'
    },
    start_time: {
      type: 'string',
      pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$', // Formato HH:MM ou HH:MM:SS
      description: 'Start time in HH:MM format'
    },
    end_time: {
      type: 'string',
      pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$', // Formato HH:MM ou HH:MM:SS
      description: 'End time in HH:MM format'
    },
    is_recurring: {
      type: 'boolean',
      nullable: true,
      default: true,
      description: 'Is this a recurring availability slot?'
    },
    effective_date: {
      type: 'string',
      format: 'date', // Formato YYYY-MM-DD
      nullable: true,
      description: 'Start date for non-recurring or new recurring availability'
    },
    expiration_date: {
      type: 'string',
      format: 'date', // Formato YYYY-MM-DD
      nullable: true,
      description: 'End date for non-recurring or expiring recurring availability'
    }
  },
  // 'additionalProperties: false' deve ser usado com cuidado se você espera que o frontend envie apenas campos parciais para PUT
  // Para PUT, 'minProperties: 1' pode ser útil para garantir que pelo menos um campo está sendo atualizado.
  additionalProperties: false
};

// Schema para a resposta de EmployeeAvailability
const employeeAvailabilityResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    day_of_week: { type: 'integer' },
    start_time: { type: 'string' },
    end_time: { type: 'string' },
    is_recurring: { type: 'boolean' },
    effective_date: { type: 'string', format: 'date', nullable: true },
    expiration_date: { type: 'string', format: 'date', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'employee_id', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'createdAt', 'updatedAt']
};

const employeeAvailabilityListResponseSchema = {
  type: 'array',
  items: employeeAvailabilityResponseSchema
};

// Schemas para parâmetros de rota
const employeeIdParamSchema = { // Já definido em outros schemas, mas para clareza aqui
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' }
  },
  required: ['employeeId']
};

const availabilityIdParamSchema = {
  type: 'object',
  properties: {
    availabilityId: { type: 'string', format: 'uuid' }
  },
  required: ['availabilityId']
};

// Schema para parâmetros de rota que incluem employeeId e availabilityId
const employeeAvailabilityParamsSchema = {
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' },
    availabilityId: { type: 'string', format: 'uuid' }
  },
  required: ['employeeId', 'availabilityId']
};

module.exports = {
  createUpdateEmployeeAvailabilitySchema,
  employeeAvailabilityResponseSchema,
  employeeAvailabilityListResponseSchema,
  employeeIdParamSchema,
  availabilityIdParamSchema,
  employeeAvailabilityParamsSchema
};
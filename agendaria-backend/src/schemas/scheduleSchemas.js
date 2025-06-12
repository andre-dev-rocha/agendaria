// src/schemas/scheduleSchemas.js

// Schema para criar um agendamento
const createScheduleSchema = {
  type: 'object',
  required: ['employeeId', 'serviceId', 'start_time'],
  properties: {
    employeeId: { type: 'string', format: 'uuid', description: 'ID of the employee for the appointment.' },
    serviceId: { type: 'string', format: 'uuid', description: 'ID of the service for the appointment.' },
    start_time: { type: 'string', format: 'date-time', description: 'Start time of the appointment (ISO 8601 format).' },
    notes: { type: 'string', maxLength: 1000, nullable: true, description: 'Optional notes for the appointment.' }
  },
  additionalProperties: false
};

// Schema para buscar horários disponíveis
const getAvailableSlotsSchema = {
  type: 'object',
  required: ['employeeId', 'serviceId', 'date'],
  properties: {
    employeeId: { type: 'string', format: 'uuid', description: 'ID of the employee to check availability for.' },
    serviceId: { type: 'string', format: 'uuid', description: 'ID of the service to be performed.' },
    date: { type: 'string', format: 'date', description: 'Date to check availability for (YYYY-MM-DD).' }
  },
  additionalProperties: false
};

// Schema para a resposta de um agendamento
const scheduleResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    client_id: { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    service_id: { type: 'string', format: 'uuid' },
    start_time: { type: 'string', format: 'date-time' },
    end_time: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'canceled', 'completed'] },
    notes: { type: 'string', nullable: true },
    google_calendar_event_id: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    client: { // Detalhes do cliente
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    },
    employee: { // Detalhes do funcionário
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    },
    service: { // Detalhes do serviço
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        duration: { type: 'integer' },
        price: { type: 'number' }
      }
    }
  },
  required: ['id', 'client_id', 'employee_id', 'service_id', 'start_time', 'end_time', 'status', 'createdAt', 'updatedAt']
};

const scheduleListResponseSchema = {
  type: 'array',
  items: scheduleResponseSchema
};

const scheduleParamsSchema = {
  type: 'object',
  properties: {
    scheduleId: { type: 'string', format: 'uuid' }
  },
  required: ['scheduleId']
};

// Schema para o output de slots disponíveis
const availableSlotsResponseSchema = {
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' },
    date: { type: 'string', format: 'date' },
    slots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' }
        },
        required: ['start_time', 'end_time']
      }
    }
  },
  required: ['employeeId', 'serviceId', 'date', 'slots']
};

module.exports = {
  createScheduleSchema,
  getAvailableSlotsSchema,
  scheduleResponseSchema,
  scheduleListResponseSchema,
  scheduleParamsSchema,
  availableSlotsResponseSchema
};
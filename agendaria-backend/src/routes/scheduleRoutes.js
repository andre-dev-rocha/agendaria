// src/routes/scheduleRoutes.js
const scheduleController = require('../controllers/scheduleController');
const {
  createScheduleSchema,
  getAvailableSlotsSchema,
  scheduleResponseSchema,
  scheduleListResponseSchema,
  scheduleParamsSchema,
  availableSlotsResponseSchema
} = require('../schemas/scheduleSchemas');
const { companyIdParamSchema } = require('../schemas/companySchemas'); // Reutiliza schema de param

async function scheduleRoutes (fastify, options) {
  // Rotas de Agendamento

  // Buscar horários disponíveis (QUALQUER USUÁRIO AUTENTICADO)
  // URL: /api/schedules/available-slots?employeeId=...&serviceId=...&date=...
  fastify.get('/schedules/available-slots', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: getAvailableSlotsSchema, // Query parameters para GET
      response: {
        200: availableSlotsResponseSchema,
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.getAvailableSlots);

  // Criar Agendamento (APENAS CLIENTE)
  // URL: /api/schedules
  fastify.post('/schedules', {
    onRequest: [fastify.authenticate], // A validação de role 'client' é no controller
    schema: {
      body: createScheduleSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            schedule: scheduleResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } } // Conflito de agendamento/disponibilidade
      }
    }
  }, scheduleController.createSchedule);

  // Listar meus agendamentos (CLIENTE)
  // URL: /api/schedules/my-client-schedules
  fastify.get('/schedules/my-client-schedules', {
    onRequest: [fastify.authenticate], // A validação de role 'client' é no controller
    schema: {
      response: {
        200: scheduleListResponseSchema,
        403: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.getMyClientSchedules);

  // Listar minha agenda como funcionário (EMPLOYEE ou ADMIN)
  // URL: /api/schedules/my-employee-schedules
  fastify.get('/schedules/my-employee-schedules', {
    onRequest: [fastify.authenticate], // A validação de role é no controller
    schema: {
      response: {
        200: scheduleListResponseSchema,
        403: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.getMyEmployeeSchedules);

  // Listar agendamentos de uma empresa (ADMIN e dono da empresa)
  // URL: /api/companies/:companyId/schedules
  fastify.get('/companies/:companyId/schedules', {
    onRequest: [fastify.authenticate], // A validação de role 'admin' e posse da empresa é no controller/service
    schema: {
      params: companyIdParamSchema,
      response: {
        200: scheduleListResponseSchema,
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.getCompanySchedules);

  // Atualizar status do agendamento (CLIENTE [cancelar], EMPLOYEE, ADMIN)
  // URL: /api/schedules/:scheduleId/status
  fastify.put('/schedules/:scheduleId/status', {
    onRequest: [fastify.authenticate], // Autorização complexa no service
    schema: {
      params: scheduleParamsSchema,
      body: { // Schema simples para o novo status
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'canceled', 'completed'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            schedule: scheduleResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.updateScheduleStatus);

  // Deletar Agendamento (CLIENTE [pendente], EMPLOYEE, ADMIN)
  // URL: /api/schedules/:scheduleId
  fastify.delete('/schedules/:scheduleId', {
    onRequest: [fastify.authenticate], // Autorização complexa no service
    schema: {
      params: scheduleParamsSchema,
      response: {
        204: {},
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, scheduleController.deleteSchedule);
}

module.exports = scheduleRoutes;
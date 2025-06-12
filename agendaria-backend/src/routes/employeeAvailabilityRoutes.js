// src/routes/employeeAvailabilityRoutes.js
const employeeAvailabilityController = require('../controllers/employeeAvailabilityController');
const {
  createUpdateEmployeeAvailabilitySchema,
  employeeAvailabilityResponseSchema,
  employeeAvailabilityListResponseSchema,
  employeeIdParamSchema,
  availabilityIdParamSchema,
  employeeAvailabilityParamsSchema
} = require('../schemas/employeeAvailabilitySchemas');

async function employeeAvailabilityRoutes (fastify, options) {
  // Rotas para gerenciar a disponibilidade de funcionários

  // Criar Disponibilidade (Admin dono da empresa do funcionário OU o próprio funcionário)
  // URL: /api/employees/:employeeId/availabilities
  fastify.post('/employees/:employeeId/availabilities', {
    onRequest: [fastify.authenticate], // A autorização é complexa e feita no service
    schema: {
      params: employeeIdParamSchema,
      body: createUpdateEmployeeAvailabilitySchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            availability: employeeAvailabilityResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } } // Conflito de horário
      }
    }
  }, employeeAvailabilityController.createAvailability);

  // Listar Disponibilidades de um funcionário (Aberto para qualquer usuário autenticado)
  // URL: /api/employees/:employeeId/availabilities
  fastify.get('/employees/:employeeId/availabilities', {
    onRequest: [fastify.authenticate],
    schema: {
      params: employeeIdParamSchema,
      response: {
        200: employeeAvailabilityListResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeAvailabilityController.listEmployeeAvailabilities);

  // Obter detalhes de uma disponibilidade específica (Aberto para qualquer usuário autenticado)
  // URL: /api/availabilities/:availabilityId
  fastify.get('/availabilities/:availabilityId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: availabilityIdParamSchema,
      response: {
        200: employeeAvailabilityResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeAvailabilityController.getAvailability);


  // Atualizar Disponibilidade (Admin dono da empresa do funcionário OU o próprio funcionário)
  // URL: /api/employees/:employeeId/availabilities/:availabilityId
  fastify.put('/employees/:employeeId/availabilities/:availabilityId', {
    onRequest: [fastify.authenticate], // A autorização é complexa e feita no service
    schema: {
      params: employeeAvailabilityParamsSchema,
      body: createUpdateEmployeeAvailabilitySchema, // Usando o mesmo schema de criação para update
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            availability: employeeAvailabilityResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeAvailabilityController.updateAvailability);

  // Deletar Disponibilidade (Admin dono da empresa do funcionário OU o próprio funcionário)
  // URL: /api/employees/:employeeId/availabilities/:availabilityId
  fastify.delete('/employees/:employeeId/availabilities/:availabilityId', {
    onRequest: [fastify.authenticate], // A autorização é complexa e feita no service
    schema: {
      params: employeeAvailabilityParamsSchema,
      response: {
        204: {}, // No content for success
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeAvailabilityController.deleteAvailability);
}

module.exports = employeeAvailabilityRoutes;
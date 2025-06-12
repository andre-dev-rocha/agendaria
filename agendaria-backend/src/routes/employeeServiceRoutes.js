// src/routes/employeeServiceRoutes.js
const employeeServiceController = require('../controllers/employeeServiceController');
const {
  addEmployeeServiceSchema,
  employeeServiceResponseSchema,
  employeeServicesListResponseSchema,
  employeeIdParamSchema,
  employeeAndServiceParamsSchema
} = require('../schemas/employeeServiceSchemas');

async function employeeServiceRoutes (fastify, options) {
  // Rotas para gerenciar serviços por funcionário

  // Adicionar serviço a um funcionário (Admin da empresa do serviço OU o próprio funcionário)
  // URL: /api/employees/:employeeId/services
  fastify.post('/employees/:employeeId/services', {
    onRequest: [fastify.authenticate], // Autorização complexa no service
    schema: {
      params: employeeIdParamSchema,
      body: addEmployeeServiceSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            association: employeeServiceResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeServiceController.addEmployeeService);

  // Listar serviços de um funcionário (Aberto para qualquer usuário autenticado)
  // URL: /api/employees/:employeeId/services
  fastify.get('/employees/:employeeId/services', {
    onRequest: [fastify.authenticate],
    schema: {
      params: employeeIdParamSchema,
      response: {
        200: employeeServicesListResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeServiceController.getEmployeeServices);

  // Remover serviço de um funcionário (Admin da empresa do serviço OU o próprio funcionário)
  // URL: /api/employees/:employeeId/services/:serviceId
  fastify.delete('/employees/:employeeId/services/:serviceId', {
    onRequest: [fastify.authenticate], // Autorização complexa no service
    schema: {
      params: employeeAndServiceParamsSchema,
      response: {
        204: {},
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, employeeServiceController.removeEmployeeService);
}

module.exports = employeeServiceRoutes;
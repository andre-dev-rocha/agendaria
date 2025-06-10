// src/routes/serviceRoutes.js
const serviceController = require('../controllers/serviceController');
const {
  createServiceSchema,
  updateServiceSchema,
  serviceResponseSchema,
  serviceListResponseSchema,
  serviceParamsSchema,
  companyServiceParamsSchema,
  companyIdParamSchema
} = require('../schemas/serviceSchemas');

async function serviceRoutes (fastify, options) {
  // Rotas de Serviço

  // Criar Serviço para uma Empresa (apenas ADMIN, dono da empresa)
  // URL: /api/companies/:companyId/services
  fastify.post('/companies/:companyId/services', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin']) // Apenas admin pode criar/gerenciar serviços da empresa
    ],
    schema: {
      params: companyIdParamSchema, // Valida que companyId é um UUID válido
      body: createServiceSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            service: serviceResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, serviceController.createService);

  // Listar todos os serviços de uma empresa específica (acesso geral para autenticados)
  // URL: /api/companies/:companyId/services
  fastify.get('/companies/:companyId/services', {
    onRequest: [fastify.authenticate],
    schema: {
      params: companyIdParamSchema,
      response: {
        200: serviceListResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, serviceController.listServicesByCompany);

  // Obter detalhes de um serviço específico (acesso geral para autenticados)
  // URL: /api/services/:serviceId
  fastify.get('/services/:serviceId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: serviceParamsSchema, // Valida o serviceId nos parâmetros da URL
      response: {
        200: serviceResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, serviceController.getService);

  // Atualizar Serviço (apenas ADMIN, dono da empresa)
  // URL: /api/companies/:companyId/services/:serviceId
  fastify.put('/companies/:companyId/services/:serviceId', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin'])
    ],
    schema: {
      params: companyServiceParamsSchema, // Valida companyId e serviceId
      body: updateServiceSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            service: serviceResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, serviceController.updateService);

  // Deletar Serviço (apenas ADMIN, dono da empresa)
  // URL: /api/companies/:companyId/services/:serviceId
  fastify.delete('/companies/:companyId/services/:serviceId', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin'])
    ],
    schema: {
      params: companyServiceParamsSchema, // Valida companyId e serviceId
      response: {
        204: {}, // No content for success
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, serviceController.deleteService);
}

module.exports = serviceRoutes;
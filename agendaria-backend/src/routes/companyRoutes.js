// src/routes/companyRoutes.js
const companyController = require('../controllers/companyController');
const {
  createCompanySchema,
  updateCompanySchema,
  companyResponseSchema,
  companyListResponseSchema,
  companyParamsSchema
} = require('../schemas/companySchemas');

async function companyRoutes (fastify, options) {
  // Rotas de Empresa
  // Todas as rotas abaixo requerem autenticação (fastify.authenticate)
  // Algumas requerem autorização específica de role (fastify.authorize)
  // Outras têm a autorização de propriedade (is owner) dentro do service/controller.

  // Criar Empresa (apenas ADMIN)
  fastify.post('/companies', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin']) // Apenas usuários com role 'admin' podem criar
    ],
    schema: {
      body: createCompanySchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            company: companyResponseSchema
          }
        }
      }
    }
  }, companyController.createCompany);

  // Obter detalhes de uma empresa específica (acesso geral para usuários autenticados)
  fastify.get('/companies/:companyId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: companyParamsSchema, // Valida o companyId nos parâmetros da URL
      response: {
        200: companyResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyController.getCompany);

  // Listar todas as empresas (acesso geral para usuários autenticados)
  fastify.get('/companies', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        200: companyListResponseSchema
      }
    }
  }, companyController.listCompanies);

  // Atualizar Empresa (apenas o DONO da empresa)
  fastify.put('/companies/:companyId', {
    onRequest: [fastify.authenticate], // A autorização de propriedade é feita no service
    schema: {
      params: companyParamsSchema,
      body: updateCompanySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            company: companyResponseSchema
          }
        },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyController.updateCompany);

  // Deletar Empresa (apenas o DONO da empresa)
  fastify.delete('/companies/:companyId', {
    onRequest: [fastify.authenticate], // A autorização de propriedade é feita no service
    schema: {
      params: companyParamsSchema,
      response: {
        204: {}, // No content for success
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyController.deleteCompany);
}

module.exports = companyRoutes;
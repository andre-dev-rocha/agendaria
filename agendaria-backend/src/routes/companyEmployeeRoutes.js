// src/routes/companyEmployeeRoutes.js
const companyEmployeeController = require('../controllers/companyEmployeeController');
const {
  inviteEmployeeSchema,
  acceptInviteSchema,
  companyEmployeeResponseSchema,
  companyEmployeeListResponseSchema,
  companyIdParamSchema,
  employeeIdParamSchema
} = require('../schemas/companyEmployeeSchemas');

async function companyEmployeeRoutes (fastify, options) {
  // Rotas de Gerenciamento de Funcionários da Empresa

  // Convidar funcionário para uma empresa (ADMIN e dono da empresa)
  // URL: /api/companies/:companyId/employees/invite
  fastify.post('/companies/:companyId/employees/invite', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin'])
    ],
    schema: {
      params: companyIdParamSchema,
      body: inviteEmployeeSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            companyEmployee: companyEmployeeResponseSchema
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } } // Conflito
      }
    }
  }, companyEmployeeController.inviteEmployee);

  // Listar funcionários (e convites pendentes) de uma empresa (ADMIN ou EMPLOYEE da empresa)
  // URL: /api/companies/:companyId/employees
  fastify.get('/companies/:companyId/employees', {
    onRequest: [
      fastify.authenticate // A autorização de visualizar funcionários é feita no service
    ],
    schema: {
      params: companyIdParamSchema,
      response: {
        200: companyEmployeeListResponseSchema,
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyEmployeeController.listCompanyEmployees);

  // Remover funcionário de uma empresa (ADMIN e dono da empresa)
  // URL: /api/companies/:companyId/employees/:employeeId
  fastify.delete('/companies/:companyId/employees/:employeeId', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin'])
    ],
    schema: {
      params: { // companyIdParamSchema + employeeIdParamSchema
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' }
        },
        required: ['companyId', 'employeeId']
      },
      response: {
        204: {},
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyEmployeeController.removeEmployee);

  // Rotas para o próprio funcionário gerenciar convites
  // Listar meus convites pendentes (QUALQUER USUÁRIO AUTENTICADO)
  // URL: /api/my-invitations
  fastify.get('/my-invitations', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        200: companyEmployeeListResponseSchema // Reutiliza o schema de lista
      }
    }
  }, companyEmployeeController.listMyInvitations);

  // Aceitar um convite de empresa (QUALQUER USUÁRIO AUTENTICADO que recebeu o convite)
  // URL: /api/my-invitations/accept
  fastify.post('/my-invitations/accept', {
    onRequest: [fastify.authenticate],
    schema: {
      body: acceptInviteSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            companyEmployee: companyEmployeeResponseSchema
          }
        },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyEmployeeController.acceptInvitation);

  // Rejeitar um convite de empresa (QUALQUER USUÁRIO AUTENTICADO que recebeu o convite)
  // URL: /api/my-invitations/reject
  fastify.post('/my-invitations/reject', {
    onRequest: [fastify.authenticate],
    schema: {
      body: acceptInviteSchema, // Mesmo body que aceitar, só precisa do companyId
      response: {
        204: {},
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, companyEmployeeController.rejectInvitation);
}

module.exports = companyEmployeeRoutes;
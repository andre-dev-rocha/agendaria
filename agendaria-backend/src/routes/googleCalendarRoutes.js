// src/routes/googleCalendarRoutes.js
const googleCalendarController = require('../controllers/googleCalendarController');
const { companyIdParamSchema } = require('../schemas/companySchemas'); // Apenas para UUID format

async function googleCalendarRoutes (fastify, options) {
  // Rotas de Integração com Google Calendar

  // 1. Gerar URL de autorização (para funcionários/admins)
  // O frontend redirecionará o usuário para esta URL do Google.
  fastify.get('/google-calendar/connect', {
    onRequest: [fastify.authenticate], // Apenas usuários autenticados
    schema: {
        response: {
            200: { type: 'object', properties: { authUrl: { type: 'string' } }, required: ['authUrl'] },
            403: { type: 'object', properties: { error: { type: 'string' } } }
        }
    }
  }, googleCalendarController.connectGoogleCalendar);

  // 2. Salvar tokens após o usuário autorizar (frontend envia o código)
  // O Fastify espera o 'code' no corpo da requisição POST.
  fastify.post('/google-calendar/save-tokens', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', description: 'Authorization code from Google OAuth.' }
        },
        additionalProperties: false
      },
      response: {
        200: { type: 'object', properties: { message: { type: 'string' }, user: { /* Esquema do usuário */ } } },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, googleCalendarController.saveGoogleCalendarTokens);

  // 3. Desconectar Google Calendar (para funcionários/admins)
  fastify.post('/google-calendar/disconnect', {
    onRequest: [fastify.authenticate],
    schema: {
        response: {
            200: { type: 'object', properties: { message: { type: 'string' } } },
            403: { type: 'object', properties: { error: { type: 'string' } } }
        }
    }
  }, googleCalendarController.disconnectGoogleCalendar);

  // **Integração com Agendamentos**: Modificaremos ScheduleService para chamar create/update/deleteCalendarEvent.
  // Não há rotas separadas aqui para isso, pois é uma ação interna do backend.
}

module.exports = googleCalendarRoutes;
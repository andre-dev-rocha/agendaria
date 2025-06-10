// src/routes/authRoutes.js
const authController = require('../controllers/authController');
const {
  registerUserSchema,
  loginUserSchema,
  authSuccessResponseSchema,
  authRegisterSuccessResponseSchema
} = require('../schemas/authSchemas'); // Importa os schemas

async function authRoutes (fastify, options) {
  // Rota de registro
  fastify.post('/auth/register', {
    schema: {
      body: registerUserSchema,          // Aplica schema ao corpo da requisição
      response: {
        201: authRegisterSuccessResponseSchema, // Schema para resposta de sucesso (status 201)
        409: { type: 'object', properties: { error: { type: 'string' } } }, // Schema para erro de conflito
        500: { type: 'object', properties: { error: { type: 'string' } } }  // Schema para erro genérico
      }
    }
  }, authController.register);

  // Rota de login
  fastify.post('/auth/login', {
    schema: {
      body: loginUserSchema,             // Aplica schema ao corpo da requisição
      response: {
        200: authSuccessResponseSchema,  // Schema para resposta de sucesso (status 200)
        401: { type: 'object', properties: { error: { type: 'string' } } }, // Schema para erro de autenticação
        500: { type: 'object', properties: { error: { type: 'string' } } }  // Schema para erro genérico
      }
    }
  }, authController.login);
}

module.exports = authRoutes;
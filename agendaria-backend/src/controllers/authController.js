// src/controllers/authController.js
const authService = require('../services/authService');

class AuthController {
  /**
   * Manipula a requisição de registro de usuário.
   * @param {FastifyRequest} request
   * @param {FastifyReply} reply
   */
  async register(request, reply) {
    try {
      const user = await authService.register(request.body);
      reply.code(201).send({ message: 'User registered successfully', user });
    } catch (error) {
      // Fastify lida com erros de forma mais robusta, mas é bom dar um feedback específico aqui
      // Se o erro tiver um statusCode (como 409 do service), use-o.
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Manipula a requisição de login de usuário.
   * @param {FastifyRequest} request
   * @param {FastifyReply} reply
   */
  async login(request, reply) {
    try {
      const { email, password } = request.body;
      const { user, token } = await authService.login(email, password);
      reply.code(200).send({ message: 'Login successful', user, token });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new AuthController();
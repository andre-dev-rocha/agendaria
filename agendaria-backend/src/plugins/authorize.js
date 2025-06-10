// src/plugins/authorize.js
const fp = require('fastify-plugin');

async function authorize (fastify, options) {
  /**
   * Decorador para verificar se o usuário tem um dos papéis necessários.
   * @param {string[]} allowedRoles - Array de papéis permitidos (ex: ['admin', 'employee']).
   */
  fastify.decorate('authorize', (allowedRoles) => {
    return async (request, reply) => {
      // O 'request.user' é definido pelo plugin 'authenticate'.
      // Se não houver 'request.user', significa que a autenticação falhou (ou não foi aplicada antes desta autorização).
      if (!request.user || !request.user.role) {
        reply.code(403).send({ error: 'Forbidden', message: 'User not authenticated or role not found.' });
        return;
      }

      const userRole = request.user.role;

      // Verifica se o papel do usuário está na lista de papéis permitidos.
      if (!allowedRoles.includes(userRole)) {
        reply.code(403).send({ error: 'Forbidden', message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}.` });
        return;
      }
      // Se o papel for permitido, continue para o próximo hook/handler da rota.
    };
  });
}

module.exports = fp(authorize);
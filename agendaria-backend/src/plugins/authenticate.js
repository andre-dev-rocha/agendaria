const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Sua chave secreta do .env

async function authenticate (fastify, options) {
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        reply.code(401).send({ error: 'Authorization header missing' });
        return;
      }

      // O cabeçalho geralmente é "Bearer TOKEN"
      const token = authHeader.split(' ')[1];

      if (!token) {
        reply.code(401).send({ error: 'Bearer token missing' });
        return;
      }

      // Verifica e decodifica o token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Adiciona as informações do usuário decodificadas ao objeto request
      // Isso permite que você acesse request.user.userId, request.user.role nas suas rotas
      request.user = decoded;

    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        reply.code(401).send({ error: 'Token expired', message: err.message });
      } else if (err instanceof jwt.JsonWebTokenError) {
        reply.code(401).send({ error: 'Invalid token', message: err.message });
      } else {
        reply.code(500).send({ error: 'Authentication failed', message: err.message });
      }
    }
  });
}

module.exports = fp(authenticate);
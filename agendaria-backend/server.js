// server.js (Atualizado)
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const db = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const companyEmployeeRoutes = require('./src/routes/companyEmployeeRoutes'); // Importa as novas rotas
const authenticatePlugin = require('./src/plugins/authenticate');
const authorizePlugin = require('./src/plugins/authorize');

const PORT = process.env.PORT || 3000;

fastify.register(authenticatePlugin);
fastify.register(authorizePlugin);

fastify.after(() => {
  fastify.register(authRoutes, { prefix: '/api' });
  fastify.register(companyRoutes, { prefix: '/api' });
  fastify.register(serviceRoutes, { prefix: '/api' });
  fastify.register(companyEmployeeRoutes, { prefix: '/api' }); // Registra as rotas de CompanyEmployee

  // ... (manter as rotas de teste /api/protected, /api/admin-dashboard, /api/employee-agenda se desejar)
  fastify.get('/api/protected', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    return {
      message: 'You accessed a protected route!',
      userId: request.user.userId,
      userRole: request.user.role
    };
  });

  fastify.get('/api/admin-dashboard', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin'])
    ]
  }, async (request, reply) => {
    return {
      message: 'Welcome to the admin dashboard!',
      userId: request.user.userId,
      userRole: request.user.role
    };
  });

  fastify.get('/api/employee-agenda', {
    onRequest: [
      fastify.authenticate,
      fastify.authorize(['admin', 'employee'])
    ]
  }, async (request, reply) => {
    return {
      message: 'This is the employee agenda!',
      userId: request.user.userId,
      userRole: request.user.role
    };
  });
});

fastify.get('/', async (request, reply) => {
  return { hello: 'world', message: 'Fastify server is running!' };
});

fastify.addHook('onReady', async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
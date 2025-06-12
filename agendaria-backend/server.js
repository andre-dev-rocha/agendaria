// server.js (Atualizado)
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const db = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const companyEmployeeRoutes = require('./src/routes/companyEmployeeRoutes');
const employeeServiceRoutes = require('./src/routes/employeeServiceRoutes');
const employeeAvailabilityRoutes = require('./src/routes/employeeAvailabilityRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes'); // Importa as novas rotas
const authenticatePlugin = require('./src/plugins/authenticate');
const authorizePlugin = require('./src/plugins/authorize');

const PORT = process.env.PORT || 3000;

fastify.register(authenticatePlugin);
fastify.register(authorizePlugin);

fastify.after(() => {
  fastify.register(authRoutes, { prefix: '/api' });
  fastify.register(companyRoutes, { prefix: '/api' });
  fastify.register(serviceRoutes, { prefix: '/api' });
  fastify.register(companyEmployeeRoutes, { prefix: '/api' });
  fastify.register(employeeServiceRoutes, { prefix: '/api' });
  fastify.register(employeeAvailabilityRoutes, { prefix: '/api' });
  fastify.register(scheduleRoutes, { prefix: '/api' }); // Registra as rotas de Schedule

  // ... (manter as rotas de teste se desejar)
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
// src/controllers/employeeServiceController.js
const employeeServiceService = require('../services/employeeServiceService');

class EmployeeServiceController {
  /**
   * Associa um serviço a um funcionário.
   * Requer autenticação. Autorização (se admin, deve ser dono da empresa do serviço; se employee, deve ser o próprio) é no service.
   */
  async addEmployeeService(request, reply) {
    try {
      const { employeeId } = request.params;
      const { serviceId } = request.body;
      const { userId: requestingUserId, role } = request.user;

      const association = await employeeServiceService.addEmployeeService(employeeId, serviceId, requestingUserId);
      reply.code(201).send({ message: 'Service associated successfully', association });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Remove a associação de um serviço a um funcionário.
   * Requer autenticação. Autorização (se admin, deve ser dono da empresa do serviço; se employee, deve ser o próprio) é no service.
   */
  async removeEmployeeService(request, reply) {
    try {
      const { employeeId, serviceId } = request.params;
      const { userId: requestingUserId, role } = request.user;

      const deleted = await employeeServiceService.removeEmployeeService(employeeId, serviceId, requestingUserId);
      if (deleted) {
        reply.code(204).send();
      } else {
        reply.code(404).send({ error: 'Association not found or not authorized.' });
      }
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista todos os serviços associados a um funcionário.
   * Acesso para todos os usuários autenticados.
   */
  async getEmployeeServices(request, reply) {
    try {
      const { employeeId } = request.params;
      const services = await employeeServiceService.getEmployeeServices(employeeId);
      reply.code(200).send(services);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new EmployeeServiceController();
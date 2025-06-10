// src/controllers/serviceController.js
const serviceService = require('../services/serviceService');

class ServiceController {
  /**
   * Cria um novo serviço para uma empresa específica.
   * Requer autenticação e que o usuário seja 'admin' e dono da empresa.
   */
  async createService(request, reply) {
    try {
      const { companyId } = request.params;
      const { userId: ownerId, role } = request.user; // userId é o ownerId da requisição

      // O middleware de autorização já garante que seja admin,
      // mas a verificação de propriedade da empresa é feita no service.
      const service = await serviceService.createService(companyId, request.body, ownerId);
      reply.code(201).send({ message: 'Service created successfully', service });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Obtém detalhes de um serviço específico.
   * Requer autenticação.
   */
  async getService(request, reply) {
    try {
      const { serviceId } = request.params;
      const service = await serviceService.getServiceById(serviceId);

      if (!service) {
        return reply.code(404).send({ error: 'Service not found' });
      }

      reply.code(200).send(service);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista todos os serviços de uma empresa específica.
   * Requer autenticação.
   */
  async listServicesByCompany(request, reply) {
    try {
      const { companyId } = request.params;
      const services = await serviceService.getServicesByCompany(companyId);
      reply.code(200).send(services);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Atualiza um serviço existente.
   * Requer autenticação e que o usuário seja 'admin' e dono da empresa.
   */
  async updateService(request, reply) {
    try {
      const { companyId, serviceId } = request.params;
      const { userId: ownerId, role } = request.user;

      // O middleware de autorização já garante que seja admin,
      // mas a verificação de propriedade da empresa é feita no service.
      const updatedService = await serviceService.updateService(companyId, serviceId, request.body, ownerId);
      reply.code(200).send({ message: 'Service updated successfully', service: updatedService });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Deleta um serviço.
   * Requer autenticação e que o usuário seja 'admin' e dono da empresa.
   */
  async deleteService(request, reply) {
    try {
      const { companyId, serviceId } = request.params;
      const { userId: ownerId, role } = request.user;

      // O middleware de autorização já garante que seja admin,
      // mas a verificação de propriedade da empresa é feita no service.
      const deleted = await serviceService.deleteService(companyId, serviceId, ownerId);

      if (deleted) {
        reply.code(204).send(); // No content
      } else {
        reply.code(404).send({ error: 'Service not found or not authorized to delete.' });
      }
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new ServiceController();
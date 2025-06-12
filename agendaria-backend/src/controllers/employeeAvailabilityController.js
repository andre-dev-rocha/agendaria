// src/controllers/employeeAvailabilityController.js
const employeeAvailabilityService = require('../services/employeeAvailabilityService');

class EmployeeAvailabilityController {
  /**
   * Cria uma nova disponibilidade para um funcionário.
   * Requer autenticação. Autorização (se admin, deve ser dono da empresa do funcionário; se employee, deve ser o próprio) é no service.
   */
  async createAvailability(request, reply) {
    try {
      const { employeeId } = request.params;
      const { userId: requestingUserId } = request.user;

      const availability = await employeeAvailabilityService.createAvailability(
        employeeId,
        request.body,
        requestingUserId
      );
      reply.code(201).send({ message: 'Availability created successfully', availability });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Obtém uma disponibilidade específica.
   * Acesso para todos os usuários autenticados.
   */
  async getAvailability(request, reply) {
    try {
      const { availabilityId } = request.params;
      const availability = await employeeAvailabilityService.getAvailabilityById(availabilityId);

      if (!availability) {
        return reply.code(404).send({ error: 'Availability not found' });
      }
      reply.code(200).send(availability);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista todas as disponibilidades de um funcionário.
   * Acesso para todos os usuários autenticados (clientes podem ver horários).
   */
  async listEmployeeAvailabilities(request, reply) {
    try {
      const { employeeId } = request.params;
      const availabilities = await employeeAvailabilityService.getEmployeeAvailabilities(employeeId);
      reply.code(200).send(availabilities);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Atualiza uma disponibilidade existente.
   * Requer autenticação. Autorização (se admin, deve ser dono da empresa do funcionário; se employee, deve ser o próprio) é no service.
   */
  async updateAvailability(request, reply) {
    try {
      const { employeeId, availabilityId } = request.params;
      const { userId: requestingUserId } = request.user;

      const updatedAvailability = await employeeAvailabilityService.updateAvailability(
        employeeId,
        availabilityId,
        request.body,
        requestingUserId
      );
      reply.code(200).send({ message: 'Availability updated successfully', availability: updatedAvailability });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Deleta uma disponibilidade.
   * Requer autenticação. Autorização (se admin, deve ser dono da empresa do funcionário; se employee, deve ser o próprio) é no service.
   */
  async deleteAvailability(request, reply) {
    try {
      const { employeeId, availabilityId } = request.params;
      const { userId: requestingUserId } = request.user;

      const deleted = await employeeAvailabilityService.deleteAvailability(
        employeeId,
        availabilityId,
        requestingUserId
      );

      if (deleted) {
        reply.code(204).send(); // No content
      } else {
        reply.code(404).send({ error: 'Availability not found or not authorized to delete.' });
      }
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new EmployeeAvailabilityController();
// src/controllers/scheduleController.js
const scheduleService = require('../services/scheduleService');

class ScheduleController {
  /**
   * Encontra horários disponíveis para agendamento.
   * Acesso para qualquer usuário autenticado.
   */
  async getAvailableSlots(request, reply) {
    try {
      const { employeeId, serviceId, date } = request.query; // Query params
      const slots = await scheduleService.findAvailableSlots(employeeId, serviceId, date);
      reply.code(200).send({ employeeId, serviceId, date, slots });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Cria um novo agendamento.
   * Requer autenticação de um cliente.
   */
  async createSchedule(request, reply) {
    try {
      const { userId: clientId, role } = request.user; // O agendamento é feito pelo usuário logado

      if (role !== 'client') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only client users can create schedules.' });
      }

      const schedule = await scheduleService.createSchedule(clientId, request.body);
      reply.code(201).send({ message: 'Schedule created successfully', schedule });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista os agendamentos do cliente logado.
   * Requer autenticação de um cliente.
   */
  async getMyClientSchedules(request, reply) {
    try {
      const { userId: clientId, role } = request.user;

      if (role !== 'client') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only client users can view their own schedules.' });
      }

      const schedules = await scheduleService.getClientSchedules(clientId);
      reply.code(200).send(schedules);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista os agendamentos do funcionário logado.
   * Requer autenticação de um funcionário ou admin.
   */
  async getMyEmployeeSchedules(request, reply) {
    try {
      const { userId: employeeId, role } = request.user;

      if (role !== 'employee' && role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only employee or admin users can view their schedules.' });
      }

      const schedules = await scheduleService.getEmployeeSchedules(employeeId);
      reply.code(200).send(schedules);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista os agendamentos de uma empresa específica.
   * Requer autenticação de um admin que seja dono da empresa.
   */
  async getCompanySchedules(request, reply) {
    try {
      const { companyId } = request.params;
      const { userId: ownerId, role } = request.user;

      if (role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only admin users can view company schedules.' });
      }

      const schedules = await scheduleService.getCompanySchedules(companyId, ownerId);
      reply.code(200).send(schedules);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Atualiza o status de um agendamento.
   * Autorização complexa no service.
   */
  async updateScheduleStatus(request, reply) {
    try {
      const { scheduleId } = request.params;
      const { status } = request.body; // O corpo contém o novo status
      const { userId: requestingUserId, role: requestingUserRole } = request.user;

      const updatedSchedule = await scheduleService.updateScheduleStatus(
        scheduleId,
        status,
        requestingUserId,
        requestingUserRole
      );
      reply.code(200).send({ message: 'Schedule status updated successfully', schedule: updatedSchedule });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Deleta um agendamento.
   * Autorização complexa no service.
   */
  async deleteSchedule(request, reply) {
    try {
      const { scheduleId } = request.params;
      const { userId: requestingUserId, role: requestingUserRole } = request.user;

      await scheduleService.deleteSchedule(scheduleId, requestingUserId, requestingUserRole);
      reply.code(204).send(); // No content
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new ScheduleController();
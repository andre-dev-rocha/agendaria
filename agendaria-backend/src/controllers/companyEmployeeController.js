// src/controllers/companyEmployeeController.js
const companyEmployeeService = require('../services/companyEmployeeService');

class CompanyEmployeeController {
  /**
   * Convida um usuário para ser funcionário de uma empresa.
   * Requer autenticação e que o usuário seja 'admin' e dono da empresa.
   */
  async inviteEmployee(request, reply) {
    try {
      const { companyId } = request.params;
      const { email } = request.body;
      const { userId: ownerId } = request.user; // Usuário logado é o owner

      const companyEmployee = await companyEmployeeService.inviteEmployee(companyId, email, ownerId);
      reply.code(201).send({ message: 'Invitation sent successfully', companyEmployee });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Um usuário aceita um convite para ser funcionário.
   * Requer autenticação do usuário que aceita o convite.
   */
  async acceptInvitation(request, reply) {
    try {
      const { companyId } = request.body;
      const { userId: employeeId } = request.user; // Usuário logado é o funcionário que aceita

      const companyEmployee = await companyEmployeeService.acceptInvitation(companyId, employeeId);
      reply.code(200).send({ message: 'Invitation accepted successfully', companyEmployee });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Um usuário rejeita um convite para ser funcionário.
   * Requer autenticação do usuário que rejeita o convite.
   */
  async rejectInvitation(request, reply) {
    try {
      const { companyId } = request.body;
      const { userId: employeeId } = request.user; // Usuário logado é o funcionário que rejeita

      await companyEmployeeService.rejectInvitation(companyId, employeeId);
      reply.code(204).send(); // No content
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Remove um funcionário de uma empresa (apenas pelo dono da empresa).
   * Requer autenticação e que o usuário seja 'admin' e dono da empresa.
   */
  async removeEmployee(request, reply) {
    try {
      const { companyId, employeeId } = request.params;
      const { userId: ownerId } = request.user; // Usuário logado é o owner

      await companyEmployeeService.removeEmployee(companyId, employeeId, ownerId);
      reply.code(204).send(); // No content
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista todos os funcionários (e convites pendentes) de uma empresa específica.
   * Requer autenticação e que o usuário seja 'admin' (dono) ou 'employee' da empresa.
   */
  async listCompanyEmployees(request, reply) {
    try {
      const { companyId } = request.params;
      const { userId: requestingUserId } = request.user; // Usuário que está fazendo a requisição

      const employees = await companyEmployeeService.listCompanyEmployees(companyId, requestingUserId);
      reply.code(200).send(employees);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista os convites de empresa pendentes para o usuário logado.
   * Requer autenticação do próprio funcionário.
   */
  async listMyInvitations(request, reply) {
    try {
      const { userId: employeeId } = request.user; // Usuário logado

      const invitations = await companyEmployeeService.listEmployeeInvitations(employeeId);
      reply.code(200).send(invitations);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new CompanyEmployeeController();
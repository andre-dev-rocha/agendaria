// src/controllers/companyController.js
const companyService = require('../services/companyService');

class CompanyController {
  /**
   * Cria uma nova empresa.
   * Requer autenticação (any role) e autorização (role: admin).
   */
  async createCompany(request, reply) {
    try {
      const { userId: ownerId, role } = request.user; // Obtém o ID do usuário logado e sua role
      
      // Validação extra: Apenas usuários com role 'admin' podem criar empresas
      // Embora o middleware de autorização já faça isso, é bom ter uma checagem explícita aqui para clareza
      if (role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only admin users can create companies.' });
      }

      const company = await companyService.createCompany(request.body, ownerId);
      reply.code(201).send({ message: 'Company created successfully', company });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Obtém os detalhes de uma empresa específica.
   * Requer autenticação (any role).
   */
  async getCompany(request, reply) {
    try {
      const { companyId } = request.params;
      const company = await companyService.getCompanyById(companyId);

      if (!company) {
        return reply.code(404).send({ error: 'Company not found' });
      }

      reply.code(200).send(company);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Lista todas as empresas.
   * Requer autenticação (any role).
   */
  async listCompanies(request, reply) {
    try {
      const companies = await companyService.getAllCompanies();
      reply.code(200).send(companies);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Atualiza uma empresa existente.
   * Requer autenticação (any role) e autorização (apenas o owner da empresa).
   */
  async updateCompany(request, reply) {
    try {
      const { companyId } = request.params;
      const { userId: requestingUserId } = request.user; // O usuário que está fazendo a requisição

      const updatedCompany = await companyService.updateCompany(companyId, request.body, requestingUserId);

      reply.code(200).send({ message: 'Company updated successfully', company: updatedCompany });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Deleta uma empresa.
   * Requer autenticação (any role) e autorização (apenas o owner da empresa).
   */
  async deleteCompany(request, reply) {
    try {
      const { companyId } = request.params;
      const { userId: requestingUserId } = request.user; // O usuário que está fazendo a requisição

      const deleted = await companyService.deleteCompany(companyId, requestingUserId);

      if (deleted) {
        reply.code(204).send(); // No content
      } else {
        reply.code(404).send({ error: 'Company not found or not authorized to delete.' });
      }
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new CompanyController();
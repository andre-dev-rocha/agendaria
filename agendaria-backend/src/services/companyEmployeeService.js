// src/services/companyEmployeeService.js
const db = require('../models');
const Company = db.Company;
const User = db.User;
const CompanyEmployee = db.CompanyEmployee;

class CompanyEmployeeService {
  /**
   * Envia um convite para um usuário se tornar funcionário de uma empresa.
   * @param {string} companyId - ID da empresa que está enviando o convite.
   * @param {string} employeeEmail - Email do usuário a ser convidado.
   * @param {string} ownerId - ID do usuário que está enviando o convite (deve ser o dono da empresa).
   * @returns {Promise<CompanyEmployee>} O objeto CompanyEmployee com status 'pending'.
   * @throws {Error} Se a empresa não for encontrada, o usuário não for o dono, o usuário convidado não existir, ou já for funcionário/convidado.
   */
  async inviteEmployee(companyId, employeeEmail, ownerId) {
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }
    if (company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company to invite employees.');
      error.statusCode = 403;
      throw error;
    }

    const employeeUser = await User.findOne({ where: { email: employeeEmail } });
    if (!employeeUser) {
      const error = new Error('User with this email not found.');
      error.statusCode = 404;
      throw error;
    }

    // Garante que o convidado não seja o próprio dono da empresa
    if (employeeUser.id === ownerId) {
        const error = new Error('Cannot invite yourself as an employee to your own company.');
        error.statusCode = 400;
        throw error;
    }

    // Verifica se já existe uma associação ou convite pendente
    const existingAssociation = await CompanyEmployee.findOne({
      where: {
        company_id: companyId,
        employee_id: employeeUser.id
      }
    });

    if (existingAssociation) {
      if (existingAssociation.status === 'accepted') {
        const error = new Error('User is already an employee of this company.');
        error.statusCode = 409;
        throw error;
      } else if (existingAssociation.status === 'pending') {
        const error = new Error('Invitation already sent to this user.');
        error.statusCode = 409;
        throw error;
      }
    }

    // Cria o convite pendente
    const companyEmployee = await CompanyEmployee.create({
      company_id: companyId,
      employee_id: employeeUser.id,
      status: 'pending'
    });

    // TODO: Aqui você poderia enviar uma notificação por email ou no aplicativo para o employeeUser

    return companyEmployee.toJSON();
  }

  /**
   * Permite que um usuário aceite um convite para se tornar funcionário.
   * @param {string} companyId - ID da empresa para a qual o convite foi enviado.
   * @param {string} employeeId - ID do usuário que está aceitando o convite.
   * @returns {Promise<CompanyEmployee>} O objeto CompanyEmployee atualizado para 'accepted'.
   * @throws {Error} Se o convite não for encontrado, já tiver sido aceito/rejeitado, ou o usuário não for o destinatário do convite.
   */
  async acceptInvitation(companyId, employeeId) {
    const invitation = await CompanyEmployee.findOne({
      where: {
        company_id: companyId,
        employee_id: employeeId,
        status: 'pending'
      }
    });

    if (!invitation) {
      const error = new Error('Invitation not found or already processed.');
      error.statusCode = 404;
      throw error;
    }

    // Atualiza o status para 'accepted'
    await invitation.update({ status: 'accepted' });

    // Opcional: Atualizar a role do usuário para 'employee' se ele ainda for 'client'
    // CUIDADO: Isso pode ser complexo se um usuário for employee de múltiplas empresas
    // Por enquanto, vamos manter a role do User como ela é e apenas a associação CompanyEmployee indica seu papel na empresa.
    // O role do usuário ('User.role') deve ser gerenciado com mais cuidado.
    // Para simplificar, vou considerar que a role do usuário no User pode ser 'client', 'employee' ou 'admin'.
    // A associação CompanyEmployee define o papel de "funcionário" para AQUELA EMPRESA.
    // Se você quiser que o User.role mude para 'employee' assim que aceitar um convite:
    const user = await User.findByPk(employeeId);
    if (user && user.role === 'client') { // Só muda se for cliente para não sobrescrever 'admin'
        await user.update({ role: 'employee' });
    }

    return invitation.toJSON();
  }

  /**
   * Permite que um usuário rejeite um convite para se tornar funcionário.
   * @param {string} companyId - ID da empresa para a qual o convite foi enviado.
   * @param {string} employeeId - ID do usuário que está rejeitando o convite.
   * @returns {Promise<boolean>} True se o convite foi rejeitado/removido com sucesso.
   * @throws {Error} Se o convite não for encontrado ou o usuário não for o destinatário do convensado.
   */
  async rejectInvitation(companyId, employeeId) {
    const invitation = await CompanyEmployee.findOne({
      where: {
        company_id: companyId,
        employee_id: employeeId,
        status: 'pending' // Apenas convites pendentes podem ser rejeitados
      }
    });

    if (!invitation) {
      const error = new Error('Invitation not found or already processed.');
      error.statusCode = 404;
      throw error;
    }

    await invitation.destroy(); // Remove o convite
    return true;
  }

  /**
   * Remove um funcionário de uma empresa (apenas pelo dono da empresa).
   * @param {string} companyId - ID da empresa.
   * @param {string} employeeId - ID do funcionário a ser removido.
   * @param {string} ownerId - ID do dono da empresa.
   * @returns {Promise<boolean>} True se removido com sucesso.
   * @throws {Error} Se a empresa/funcionário não for encontrado, ou o usuário não for o dono.
   */
  async removeEmployee(companyId, employeeId, ownerId) {
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }
    if (company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company to remove employees.');
      error.statusCode = 403;
      throw error;
    }

    // Não permitir remover o próprio dono da empresa como funcionário
    if (company.owner_id === employeeId) {
        const error = new Error('Cannot remove the company owner as an employee.');
        error.statusCode = 400;
        throw error;
    }

    const association = await CompanyEmployee.findOne({
      where: {
        company_id: companyId,
        employee_id: employeeId
      }
    });

    if (!association) {
      const error = new Error('Employee not found in this company.');
      error.statusCode = 404;
      throw error;
    }

    await association.destroy();
    return true;
  }

  /**
   * Lista os funcionários (incluindo convites pendentes) de uma empresa.
   * @param {string} companyId - ID da empresa.
   * @param {string} requestingUserId - ID do usuário logado (para segurança, deve ser o dono ou funcionário da empresa).
   * @returns {Promise<CompanyEmployee[]>} Lista de associações CompanyEmployee.
   * @throws {Error} Se a empresa não for encontrada ou o usuário não tiver permissão.
   */
  async listCompanyEmployees(companyId, requestingUserId) {
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }

    // Apenas o dono ou um funcionário da empresa pode listar os funcionários
    const isOwner = company.owner_id === requestingUserId;
    const isEmployee = await CompanyEmployee.count({
        where: {
            company_id: companyId,
            employee_id: requestingUserId,
            status: 'accepted'
        }
    }) > 0;

    if (!isOwner && !isEmployee) {
        const error = new Error('Unauthorized: You are not authorized to view employees of this company.');
        error.statusCode = 403;
        throw error;
    }

    const employees = await CompanyEmployee.findAll({
      where: { company_id: companyId },
      include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'email', 'role', 'phone'] }] // Inclui dados do User
    });
    return employees.map(emp => emp.toJSON());
  }

  /**
   * Lista os convites de empresa para um funcionário específico (o próprio funcionário).
   * @param {string} employeeId - ID do funcionário que está logado.
   * @returns {Promise<CompanyEmployee[]>} Lista de convites pendentes para o funcionário.
   */
  async listEmployeeInvitations(employeeId) {
    const invitations = await CompanyEmployee.findAll({
      where: {
        employee_id: employeeId,
        status: 'pending'
      },
      include: [{ model: Company, as: 'Company', attributes: ['id', 'name', 'description'] }] // Inclui dados da Company
    });
    return invitations.map(inv => inv.toJSON());
  }
}

module.exports = new CompanyEmployeeService();
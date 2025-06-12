// src/services/employeeServiceService.js
const db = require('../models');
const EmployeeService = db.EmployeeService;
const User = db.User;
const Service = db.Service;
const Company = db.Company;
const CompanyEmployee = db.CompanyEmployee;

class EmployeeServiceService {
  /**
   * Associa um serviço a um funcionário.
   * Pode ser feito pelo próprio funcionário (se role = 'employee') ou pelo admin (dono da empresa).
   * @param {string} employeeId - ID do funcionário.
   * @param {string} serviceId - ID do serviço a ser associado.
   * @param {string} requestingUserId - ID do usuário fazendo a requisição.
   * @returns {Promise<EmployeeService>} A associação criada.
   * @throws {Error} Se o funcionário ou serviço não forem encontrados, ou não houver permissão.
   */
  async addEmployeeService(employeeId, serviceId, requestingUserId) {
    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee'].includes(employee.role)) {
      const error = new Error('Employee not found or invalid role.');
      error.statusCode = 404;
      throw error;
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const error = new Error('Service not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se o solicitante é o próprio funcionário
    const isSelf = requestingUserId === employeeId;

    // Verifica se o solicitante é o ADMIN dono da empresa do serviço e do funcionário
    let isOwnerOfCompany = false;
    if (!isSelf) { // Se não for o próprio funcionário, verifica se é admin e dono
      const company = await Company.findByPk(service.company_id);
      if (company && company.owner_id === requestingUserId) {
        isOwnerOfCompany = true;
      }
    }

    // Se o solicitante não é o próprio funcionário e não é o admin dono da empresa
    if (!isSelf && !isOwnerOfCompany) {
      const error = new Error('Unauthorized: You are not authorized to assign services to this employee.');
      error.statusCode = 403;
      throw error;
    }

    // Verifica se o funcionário realmente pertence à empresa do serviço (se for admin)
    // Ou se o funcionário (employee) está tentando adicionar um serviço de uma empresa que ele não pertence.
    const employeeCompany = await CompanyEmployee.findOne({
      where: { company_id: service.company_id, employee_id: employeeId, status: 'accepted' }
    });
    if (!employeeCompany) {
      const error = new Error('Employee does not belong to the company offering this service or is not an accepted employee.');
      error.statusCode = 400;
      throw error;
    }


    const existingAssociation = await EmployeeService.findOne({
      where: { employee_id: employeeId, service_id: serviceId }
    });

    if (existingAssociation) {
      const error = new Error('Service already associated with this employee.');
      error.statusCode = 409;
      throw error;
    }

    const newAssociation = await EmployeeService.create({
      employee_id: employeeId,
      service_id: serviceId
    });

    return newAssociation.toJSON();
  }

  /**
   * Remove a associação de um serviço a um funcionário.
   * Pode ser feito pelo próprio funcionário ou pelo admin (dono da empresa).
   * @param {string} employeeId - ID do funcionário.
   * @param {string} serviceId - ID do serviço a ser removido.
   * @param {string} requestingUserId - ID do usuário fazendo a requisição.
   * @returns {Promise<boolean>} True se removido com sucesso.
   * @throws {Error} Se a associação não for encontrada, ou não houver permissão.
   */
  async removeEmployeeService(employeeId, serviceId, requestingUserId) {
    const association = await EmployeeService.findOne({
      where: { employee_id: employeeId, service_id: serviceId }
    });

    if (!association) {
      const error = new Error('Association not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se o solicitante é o próprio funcionário
    const isSelf = requestingUserId === employeeId;

    // Verifica se o solicitante é o ADMIN dono da empresa do serviço e do funcionário
    let isOwnerOfCompany = false;
    if (!isSelf) {
      const service = await Service.findByPk(serviceId);
      if (!service) { // Este caso não deveria acontecer se a associação existe, mas por segurança
        const error = new Error('Associated service not found.');
        error.statusCode = 404;
        throw error;
      }
      const company = await Company.findByPk(service.company_id);
      if (company && company.owner_id === requestingUserId) {
        isOwnerOfCompany = true;
      }
    }

    if (!isSelf && !isOwnerOfCompany) {
      const error = new Error('Unauthorized: You are not authorized to remove services from this employee.');
      error.statusCode = 403;
      throw error;
    }

    await association.destroy();
    return true;
  }

  /**
   * Lista todos os serviços associados a um funcionário específico.
   * Pode ser visualizado pelo próprio funcionário, pelo admin (dono da empresa do serviço) ou por qualquer cliente que queira agendar.
   * @param {string} employeeId - ID do funcionário.
   * @returns {Promise<EmployeeService[]>} Lista de serviços associados ao funcionário.
   * @throws {Error} Se o funcionário não for encontrado.
   */
  async getEmployeeServices(employeeId) {
    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee', 'client'].includes(employee.role)) { // Clientes também podem ver serviços de funcionários
      const error = new Error('Employee not found or invalid role.');
      error.statusCode = 404;
      throw error;
    }

    const services = await EmployeeService.findAll({
      where: { employee_id: employeeId },
      include: [
        { model: Service, as: 'service' }, // Inclui detalhes do serviço
        { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'role'] } // Inclui detalhes do funcionário
      ]
    });
    return services.map(es => es.toJSON());
  }
}

module.exports = new EmployeeServiceService();